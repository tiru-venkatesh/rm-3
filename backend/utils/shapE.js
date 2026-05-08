import { exec } from 'child_process';
import { promisify } from 'util';
import fsp from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';

const execAsync = promisify(exec);

function buildShapEScript(prompt, outputPath) {
  const safePath = outputPath.replace(/\\/g, '/');
  return `
import sys, torch
try:
    from shap_e.diffusion.sample import sample_latents
    from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
    from shap_e.models.download import load_model, load_config
    from shap_e.util.notebooks import decode_latent_mesh
except ImportError:
    print("SHAP_E_NOT_INSTALLED"); sys.exit(1)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
xm     = load_model('transmitter', device=device)
model  = load_model('text300M', device=device)
diff   = diffusion_from_config(load_config('diffusion'))

latents = sample_latents(
    batch_size=1, model=model, diffusion=diff,
    guidance_scale=15.0,
    model_kwargs=dict(texts=["${prompt.replace(/"/g, '\\"')}"]),
    progress=True, clip_denoised=True,
    use_fp16=True, use_karras=True,
    karras_steps=64, sigma_min=1e-3, sigma_max=160, s_churn=0,
)
with open("${safePath}", 'wb') as f:
    decode_latent_mesh(xm, latents[0]).tri_mesh().write_obj(f)
print("SHAP_E_SUCCESS:${safePath}")
`;
}

function fallbackOBJ(prompt) {
  return [
    `# Fallback mesh for: ${prompt}`,
    '# Install: pip install shap-e torch',
    'v -1.0  0.0  1.0', 'v  1.0  0.0  1.0', 'v  1.0  0.0 -1.0', 'v -1.0  0.0 -1.0',
    'v -1.0  2.0  1.0', 'v  1.0  2.0  1.0', 'v  1.0  2.0 -1.0', 'v -1.0  2.0 -1.0',
    'v  0.0  3.2  0.0',
    'f 1 2 6 5', 'f 2 3 7 6', 'f 3 4 8 7', 'f 4 1 5 8',
    'f 1 2 3 4', 'f 5 6 9', 'f 6 7 9', 'f 7 8 9', 'f 8 5 9',
  ].join('\n');
}

export async function generateMesh(prompt, meshesDir) {
  await fsp.mkdir(meshesDir, { recursive: true });
  const id      = uuid();
  const objPath = path.resolve(path.join(meshesDir, `mesh_${id}.obj`));
  const pyPath  = path.resolve(path.join(meshesDir, `shap_e_${id}.py`));

  await fsp.writeFile(pyPath, buildShapEScript(prompt, objPath), 'utf8');

  let log = '', usedShapE = false;
  try {
    const { stdout } = await execAsync(`python3 "${pyPath}" 2>&1`, { timeout: 300000 });
    log = stdout;
    if (stdout.includes('SHAP_E_NOT_INSTALLED')) {
      await fsp.writeFile(objPath, fallbackOBJ(prompt), 'utf8');
      log += '\n[INFO] Using fallback mesh. Run: pip install shap-e torch';
    } else if (stdout.includes('SHAP_E_SUCCESS')) {
      usedShapE = true;
    } else {
      throw new Error('Shap-E did not complete');
    }
  } catch (err) {
    await fsp.writeFile(objPath, fallbackOBJ(prompt), 'utf8');
    log = err.message + '\n[INFO] Using fallback mesh';
  }
  return { objPath, log, usedShapE };
}

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';

const execAsync = promisify(exec);

function getBlenderPath() {
  if (process.env.BLENDER_PATH) return process.env.BLENDER_PATH;

  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe',
    ];
    for (const p of candidates) {
      try { fs.accessSync(p); return p; } catch {}
    }
  }
  return 'blender';
}

export async function runBlenderScript(code) {
  const dir = process.env.SCRIPTS_DIR || './output/scripts';
  await fsp.mkdir(dir, { recursive: true });

  const id         = uuid();
  const scriptPath = path.resolve(path.join(dir, `script_${id}.py`));
  await fsp.writeFile(scriptPath, code, 'utf8');

  const blender = getBlenderPath();
  let log     = '';
  let success = true;

  try {
    const cmd = process.platform === 'win32'
      ? `"${blender}" -b -P "${scriptPath}" 2>&1`
      : `"${blender}" -b -P "${scriptPath}" 2>&1`;

    const { stdout } = await execAsync(cmd, { timeout: 120000 });
    log = stdout;
  } catch (err) {
    log     = (err.stdout || '') + '\n' + err.message;
    success = false;
  }

  return { scriptPath, log, success, id };
}

export async function ensureDirs() {
  await Promise.all([
    fsp.mkdir(process.env.SCRIPTS_DIR || './output/scripts', { recursive: true }),
    fsp.mkdir(process.env.MESHES_DIR  || './output/meshes',  { recursive: true }),
    fsp.mkdir(process.env.RENDERS_DIR || './output/renders', { recursive: true }),
  ]);
}

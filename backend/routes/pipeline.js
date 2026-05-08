import { Router } from 'express';
import Groq from 'groq-sdk';
import fsp from 'fs/promises';
import path from 'path';
import { requireUser } from '../middleware/auth.js';
import { Pipeline } from '../models/index.js';
import { generateMesh } from '../utils/shapE.js';
import { runBlenderScript, ensureDirs } from '../utils/blender.js';

const router = Router();
router.use(requireUser);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function cleanCode(raw) {
  return raw.replace(/^```python\s*/im,'').replace(/^```\s*/im,'').replace(/```\s*$/im,'').trim();
}

function pipelineBpyPrompt(prompt, meshPath, renderPath) {
  return `You are a Blender Python expert.
A mesh OBJ file exists at: ${meshPath}
Write a bpy script that:
1. Clears the scene
2. Imports the OBJ from: ${meshPath}
3. Centers and scales the imported mesh to fit in 2x2x2 bounding box
4. Creates a PBR material for it matching the theme: "${prompt}"
5. Adds HDRI sky world lighting (or fallback grey sky)
6. Sets up 3-point lighting rig
7. Places camera at (4,-4,3) looking at origin, focal 50mm
8. Adds a ground plane with shadow catcher material
9. Renders to: ${renderPath}
10. Ends with: print("REALMIND_SUCCESS")
Output ONLY Python code. No markdown.`;
}

// GET /api/pipeline
router.get('/', async (req, res, next) => {
  try {
    const pipelines = await Pipeline.find({ userId: req.uid })
      .select('prompt status createdAt renderPath')
      .sort({ createdAt: -1 }).limit(30);
    res.json({ pipelines });
  } catch (err) { next(err); }
});

// GET /api/pipeline/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, userId: req.uid });
    if (!pipeline) return res.status(404).json({ error: 'Not found' });
    res.json({ pipeline });
  } catch (err) { next(err); }
});

// DELETE /api/pipeline/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Pipeline.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/pipeline/run — SSE full pipeline
router.post('/run', async (req, res, next) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });

  const pipeline = await Pipeline.create({ userId: req.uid, prompt: prompt.trim(), status: 'queued' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event, data) => res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);

  const meshesDir  = process.env.MESHES_DIR  || './output/meshes';
  const rendersDir = process.env.RENDERS_DIR || './output/renders';
  const scriptsDir = process.env.SCRIPTS_DIR || './output/scripts';
  await ensureDirs();

  let totalLog = '';

  try {
    // Step 1 — Shap-E mesh
    send('status', { step: 1, label: 'Generating 3D mesh with Shap-E…', percent: 10 });
    await Pipeline.findByIdAndUpdate(pipeline._id, { status: 'mesh' });

    const { objPath, log: meshLog, usedShapE } = await generateMesh(prompt, meshesDir);
    totalLog += `[MESH]\n${meshLog}\n\n`;

    send('status', {
      step: 1,
      label: usedShapE ? '3D mesh generated ✓' : '3D mesh ready (fallback) ✓',
      percent: 35,
    });
    await Pipeline.findByIdAndUpdate(pipeline._id, { status: 'scripting', meshPath: objPath, log: totalLog });

    // Step 2 — Groq bpy script
    send('status', { step: 2, label: 'Writing Blender script with AI…', percent: 42 });

    const renderPath = path.resolve(path.join(rendersDir, `render_${pipeline._id}.png`));
    const completion = await groq.chat.completions.create({
      model:       process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: pipelineBpyPrompt(prompt, objPath, renderPath) },
      ],
      max_tokens:  3500,
      temperature: 0.2,
    });

    const bpyCode = cleanCode(completion.choices[0].message.content.trim());
    totalLog += `[SCRIPT]\n${bpyCode.split('\n').length} lines generated\n\n`;

    send('status', { step: 2, label: 'Blender script ready ✓', percent: 62, bpyCode });
    await Pipeline.findByIdAndUpdate(pipeline._id, { status: 'rendering', bpyCode, log: totalLog });

    // Step 3 — Blender render
    send('status', { step: 3, label: 'Running Blender and rendering…', percent: 66 });

    const { log: blenderLog, success } = await runBlenderScript(bpyCode);
    totalLog += `[BLENDER]\n${blenderLog}\n`;

    let renderUrl = null;
    try { await fsp.access(renderPath); renderUrl = `/output/renders/${path.basename(renderPath)}`; } catch {}

    const finalStatus = success && renderUrl ? 'done' : 'failed';
    await Pipeline.findByIdAndUpdate(pipeline._id, {
      status: finalStatus, renderPath: renderUrl ? renderPath : null, log: totalLog,
    });

    send('done', {
      step: 3, label: finalStatus === 'done' ? 'Pipeline complete ✓' : 'Done (check logs)',
      percent: 100, pipelineId: pipeline._id.toString(),
      renderUrl, meshPath: objPath, bpyCode, log: totalLog, success: finalStatus === 'done',
    });
    await req.user.updateOne({ $inc: { 'usage.pipelines': 1 } });
  } catch (err) {
    totalLog += `\n[ERROR] ${err.message}`;
    await Pipeline.findByIdAndUpdate(pipeline._id, { status: 'failed', error: err.message, log: totalLog });
    send('error', { label: err.message, log: totalLog });
  }

  res.end();
});

export default router;

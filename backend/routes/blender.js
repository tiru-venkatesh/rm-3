import { Router } from 'express';
import Groq from 'groq-sdk';
import fsp from 'fs/promises';
import path from 'path';
import { requireUser } from '../middleware/auth.js';
import { Script } from '../models/index.js';
import { runBlenderScript } from '../utils/blender.js';

const router = Router();
router.use(requireUser);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BPY_SYSTEM = `You are a Blender 4.x/5.x Python expert. Generate production-ready bpy scripts.

STRUCTURE (always follow this order):
1. import bpy, bmesh, mathutils, math, random
2. Clear scene: bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
3. Create all materials first (Principled BSDF with proper PBR values)
4. Create geometry using bmesh (NOT bpy.ops for mesh editing)
5. Apply modifiers (Subdivision, Bevel, Array as needed)
6. Add 3-point lighting rig (key, fill, rim)
7. Position camera (focal 50mm, position [4,-4,3])
8. Set render: Cycles, GPU compute, samples 256, denoising ON, 1920x1080
9. Export GLB to the path given in the prompt
10. Print "REALMIND_SUCCESS" at the end

RULES:
- Output ONLY valid Python. Zero markdown. Zero explanation.
- First line: import bpy
- Use bmesh for ALL mesh operations
- Make geometry interesting — use math, loops, procedural logic
- Always export GLB at the end`;

function cleanCode(raw) {
  return raw.replace(/^```python\s*/im,'').replace(/^```\s*/im,'').replace(/```\s*$/im,'').trim();
}

// POST /api/blender/generate
router.post('/generate', async (req, res, next) => {
  try {
    const { prompt, title } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });

    const rendersDir = process.env.RENDERS_DIR || './output/renders';
    await fsp.mkdir(rendersDir, { recursive: true });
    const renderPath = path.resolve(path.join(rendersDir, `render_${Date.now()}.png`));
    const glbPath    = path.resolve(path.join(rendersDir, `model_${Date.now()}.glb`));

    const completion = await groq.chat.completions.create({
      model:       process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: BPY_SYSTEM },
        { role: 'user',   content: `Create a Blender bpy script for: "${prompt}"\nExport GLB to: ${glbPath}\nSave render to: ${renderPath}` },
      ],
      max_tokens:  3500,
      temperature: 0.2,
    });

    const code = cleanCode(completion.choices[0].message.content.trim());

    const script = await Script.create({
      userId: req.uid,
      title:  title || prompt.slice(0, 60),
      prompt: prompt.trim(),
      code,
      renderPath,
    });

    await req.user.updateOne({ $inc: { 'usage.scripts': 1 } });
    res.status(201).json({ script });
  } catch (err) { next(err); }
});

// POST /api/blender/:id/run
router.post('/:id/run', async (req, res, next) => {
  try {
    const script = await Script.findOne({ _id: req.params.id, userId: req.uid });
    if (!script) return res.status(404).json({ error: 'Script not found' });

    await Script.findByIdAndUpdate(script._id, { status: 'running' });
    const { scriptPath, log, success } = await runBlenderScript(script.code);

    let renderUrl = null;
    if (script.renderPath) {
      try { await fsp.access(script.renderPath); renderUrl = '/output/renders/' + path.basename(script.renderPath); } catch {}
    }

    const updated = await Script.findByIdAndUpdate(
      script._id,
      { status: success ? 'done' : 'failed', log, filePath: scriptPath, executedAt: new Date() },
      { new: true }
    );
    res.json({ script: updated, renderUrl });
  } catch (err) { next(err); }
});

// GET /api/blender
router.get('/', async (req, res, next) => {
  try {
    const scripts = await Script.find({ userId: req.uid })
      .select('title prompt status createdAt executedAt')
      .sort({ createdAt: -1 }).limit(40);
    res.json({ scripts });
  } catch (err) { next(err); }
});

// GET /api/blender/:id
router.get('/:id', async (req, res, next) => {
  try {
    const script = await Script.findOne({ _id: req.params.id, userId: req.uid });
    if (!script) return res.status(404).json({ error: 'Not found' });
    res.json({ script });
  } catch (err) { next(err); }
});

// DELETE /api/blender/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Script.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;

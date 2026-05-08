import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { Image } from '../models/index.js';

const router = Router();
router.use(requireUser);

function pollinationsUrl(prompt, seed) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
}

// POST /api/image/generate
router.post('/generate', async (req, res, next) => {
  try {
    const { prompt, count = 1 } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });

    const total = Math.min(count, 4);
    const urls  = Array.from({ length: total }, (_, i) => pollinationsUrl(prompt.trim(), Date.now() + i));

    const images = await Image.insertMany(
      urls.map(url => ({ userId: req.uid, prompt: prompt.trim(), url, status: 'done' }))
    );
    await req.user.updateOne({ $inc: { 'usage.images': urls.length } });
    res.json({ images });
  } catch (err) { next(err); }
});

// GET /api/image
router.get('/', async (req, res, next) => {
  try {
    const images = await Image.find({ userId: req.uid, status: 'done' })
      .sort({ createdAt: -1 }).limit(40);
    res.json({ images });
  } catch (err) { next(err); }
});

// DELETE /api/image/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Image.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;

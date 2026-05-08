import { Router } from 'express';
import Groq from 'groq-sdk';
import { requireUser } from '../middleware/auth.js';

const router = Router();
router.use(requireUser);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BLUEPRINT_SYSTEM = `You are a 3D scene architect. Output ONLY valid JSON matching this schema:
{
  "scene": { "name": "string", "background": "#hex", "fog": boolean },
  "objects": [{
    "name": "string", "type": "MESH",
    "primitive": "CUBE|SPHERE|CYLINDER|PLANE|TORUS|CONE",
    "position": [x,y,z], "rotation": [x,y,z], "scale": [x,y,z],
    "modifier": "SUBDIVISION|BEVEL|ARRAY|SOLIDIFY|none", "modifier_value": number,
    "material": {
      "name": "string",
      "type": "metal|wood|glass|concrete|plastic|emission|fabric",
      "color": "#hex", "roughness": 0.0-1.0, "metallic": 0.0-1.0
    }
  }],
  "lights": [{ "name": "string", "type": "POINT|SUN|AREA|SPOT", "position": [x,y,z], "color": "#hex", "strength": number }],
  "camera": { "type": "PERSP", "position": [x,y,z], "target": [x,y,z], "fov": number, "dof": boolean },
  "render": { "engine": "CYCLES", "samples": number, "resolution": [w,h], "denoising": true }
}
Output ONLY raw JSON. No markdown. No backticks. No explanation.`;

function cleanCode(raw) {
  return raw.replace(/^```json?\s*/im,'').replace(/```\s*$/im,'').trim();
}

const BPY_FROM_BLUEPRINT = `You are a Blender Python expert.
Given a JSON scene blueprint, write a complete bpy script.
Output ONLY Python. No markdown. Start with: import bpy
Always clear scene first. Use Principled BSDF for all materials.
End with: print("REALMIND_SUCCESS")`;

router.post('/blueprint', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });

    const [jsonRes, codeRes] = await Promise.all([
      groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: BLUEPRINT_SYSTEM },
          { role: 'user',   content: `Create a 3D scene blueprint for: "${prompt}"` },
        ],
        max_tokens: 2000, temperature: 0.4,
      }),
      groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: BPY_FROM_BLUEPRINT },
          { role: 'user',   content: `Generate bpy script for scene: "${prompt}"` },
        ],
        max_tokens: 3000, temperature: 0.2,
      }),
    ]);

    let blueprint;
    try {
      blueprint = JSON.parse(cleanCode(jsonRes.choices[0].message.content.trim()));
    } catch {
      return res.status(500).json({ error: 'Failed to parse blueprint JSON' });
    }

    const bpyCode = cleanCode(codeRes.choices[0].message.content.trim())
      .replace(/^```python\s*/im,'').replace(/```\s*$/im,'').trim();

    res.json({ blueprint, bpyCode });
  } catch (err) { next(err); }
});

export default router;

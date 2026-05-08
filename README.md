# RealMind AI v3 — Setup Guide

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Framer Motion + Three.js
- Backend: Node.js + Express
- Database: MongoDB Atlas (free)
- Auth: Firebase (free)
- AI Chat: Groq API (free)
- Images: Pollinations AI (free, no key needed)
- 3D: Blender (local) + Shap-E (optional)

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:

| Key | Where to get |
|-----|-------------|
| `MONGO_URI` | mongodb.com/atlas → free cluster → Connect |
| `GROQ_API_KEY` | console.groq.com → API Keys (free) |
| `BLENDER_PATH` | Full path to blender.exe on your machine |
| `FIREBASE_*` | Firebase Console → Project Settings → Service Accounts → Generate key |

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Firebase config: Firebase Console → Project Settings → Your Apps → Web app → Config

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open → http://localhost:3000

---

## Blender Path (Windows)

Your `.env` should have:
```
BLENDER_PATH=C:\Program Files\Blender Foundation\Blender 5.1\blender.exe
```

Adjust version number as needed.

---

## Shap-E (Optional — for real 3D mesh generation)

Without Shap-E, the pipeline uses a simple fallback mesh.

To enable real AI 3D generation:
```bash
pip install torch shap-e
```

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Scene Planner | `/scene` | AI generates scene blueprint + bpy script |
| AI Pipeline | `/pipeline` | Full Text→Mesh→Render pipeline |
| Chat | `/chat` | AI chat with image generation |
| Images | `/images` | Pollinations image generator |
| Blender | `/blender` | bpy script generator + executor |
| Profile | `/profile` | Usage stats |

---

## API Routes

```
POST /api/chat/session          Create chat session
GET  /api/chat/:id              Get session + messages
POST /api/chat/:id/stream       SSE streaming response

POST /api/image/generate        Generate images (Pollinations)
GET  /api/image                 List images

POST /api/blender/generate      Generate bpy script (Groq)
POST /api/blender/:id/run       Execute in local Blender
GET  /api/blender/:id           Get script + log

POST /api/pipeline/run          Full pipeline SSE stream
GET  /api/pipeline              List pipeline runs

POST /api/scene/blueprint       Generate scene blueprint + bpy

GET  /api/user/profile          User profile + stats
```

---

## Color Theme
Deep void black + violet/purple accents. No orange. No cyan.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import chatRoutes    from './routes/chat.js';
import imageRoutes   from './routes/image.js';
import blenderRoutes from './routes/blender.js';
import pipelineRoutes from './routes/pipeline.js';
import sceneRoutes   from './routes/scene.js';
import userRoutes    from './routes/user.js';

const app = express();
await connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 60000, max: 100 }));

app.use('/output', express.static('./output'));

app.use('/api/chat',     chatRoutes);
app.use('/api/image',    imageRoutes);
app.use('/api/blender',  blenderRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/scene',    sceneRoutes);
app.use('/api/user',     userRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '3.0' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`RealMind v3 → http://localhost:${PORT}`));

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { gbpRouter } from './routes/gbp';
import { socialRouter } from './routes/social';
import { chatRouter } from './routes/chat';
import { statusRouter } from './routes/status';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0', ts: new Date().toISOString() });
});

// Routes
app.use('/gbp', gbpRouter);
app.use('/social', socialRouter);
app.use('/chat', chatRouter);
app.use('/status', statusRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 OpenClaw API running at http://localhost:${PORT}`);
  console.log(`   GBP:    http://localhost:${PORT}/gbp/reviews`);
  console.log(`   Social: http://localhost:${PORT}/social/inbox`);
  console.log(`   Status: http://localhost:${PORT}/status\n`);
});

export default app;

import { Router, Request, Response } from 'express';
import axios from 'axios';

export const statusRouter = Router();

const checkService = async (name: string, url: string) => {
  try {
    const start = Date.now();
    await axios.get(url, { timeout: 3000 });
    return { name, status: 'online', latency: Date.now() - start };
  } catch {
    return { name, status: 'offline', latency: null };
  }
};

statusRouter.get('/', async (_req: Request, res: Response) => {
  const openclawUrl = process.env.OPENCLAW_URL || 'http://localhost:18789';
  const results = await Promise.allSettled([
    checkService('OpenClaw', openclawUrl),
    checkService('Postiz', 'http://localhost:3000'),
    checkService('Mautic', 'http://localhost:8080'),
  ]);
  const services = results.map(r =>
    r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'error', latency: null }
  );
  res.json({ services, ts: new Date().toISOString() });
});

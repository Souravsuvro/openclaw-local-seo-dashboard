import { Router, Request, Response } from 'express';
import axios from 'axios';

export const chatRouter = Router();

chatRouter.post('/', async (req: Request, res: Response) => {
  const { message, personaId = 'default', model = 'gpt-4o', project = 'local-seo' } = req.body;
  const openclawUrl = process.env.OPENCLAW_URL || 'http://localhost:18789';

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    const response = await axios.post(`${openclawUrl}/chat`, {
      message, personaId, model, project,
    }, { timeout: 30000 });
    res.json(response.data);
  } catch (err: unknown) {
    // OpenClaw not running — return mock response
    const mock = {
      reply: `[MOCK] Received: "${message}" — OpenClaw gateway not detected at ${openclawUrl}. Start OpenClaw and retry.`,
      model, personaId, mock: true,
    };
    res.json(mock);
  }
});

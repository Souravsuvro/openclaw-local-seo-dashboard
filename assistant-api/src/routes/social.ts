import { Router, Request, Response } from 'express';
import axios from 'axios';
import { mockInboxItems } from '../data/mockSocial';

export const socialRouter = Router();

// GET /social/inbox
socialRouter.get('/inbox', (req: Request, res: Response) => {
  const { platform, intent, minScore } = req.query;
  let items = [...mockInboxItems];
  if (platform) items = items.filter(i => i.platform === platform);
  if (intent) items = items.filter(i => i.intent === intent);
  if (minScore) items = items.filter(i => i.leadScore >= Number(minScore));
  res.json({ items, total: items.length });
});

// POST /social/inbox/:id/handle
socialRouter.post('/inbox/:id/handle', (req: Request, res: Response) => {
  const item = mockInboxItems.find(i => i.id === req.params.id);
  if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
  res.json({ success: true, id: item.id, status: 'handled' });
});

// POST /social/inbox/:id/crm
socialRouter.post('/inbox/:id/crm', (req: Request, res: Response) => {
  const item = mockInboxItems.find(i => i.id === req.params.id);
  if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
  // In production: push to Mautic / HubSpot / Zoho here
  res.json({
    success: true,
    leadCreated: {
      id: `lead-${item.id}`,
      name: item.author,
      source: item.platform,
      score: item.leadScore,
      intent: item.intent,
      message: item.text.slice(0, 80),
      createdAt: new Date().toISOString(),
    }
  });
});

// POST /social/inbox/:id/reply-draft
socialRouter.post('/inbox/:id/reply-draft', async (req: Request, res: Response) => {
  const item = mockInboxItems.find(i => i.id === req.params.id);
  if (!item) { res.status(404).json({ error: 'Item not found' }); return; }

  const openclawUrl = process.env.OPENCLAW_URL || 'http://localhost:18789';
  try {
    const response = await axios.post(`${openclawUrl}/chat`, {
      message: `Write a short, friendly social media reply to this message. Platform: ${item.platform}. Intent: ${item.intent}. Message: "${item.text}"`,
      personaId: 'social-manager', model: 'gpt-4o',
    }, { timeout: 20000 });
    res.json({ id: item.id, draft: response.data.reply || response.data.message });
  } catch {
    const drafts: Record<string, string> = {
      booking: `Hi ${item.author}! Thanks for your interest 😊 We'd love to help. Please DM us or call for availability and pricing.`,
      pricing: `Hi ${item.author}! Happy to share our rates — please DM us or check our website for the latest pricing details.`,
      complaint: `Hi ${item.author}, we're sorry to hear this. Please DM us directly so we can resolve this for you right away.`,
      enquiry: `Hi ${item.author}! Great question. Please DM us and we'll get you all the info you need.`,
      positive: `Thank you so much ${item.author}! We really appreciate your kind words 🙏`,
    };
    res.json({ id: item.id, draft: drafts[item.intent] || drafts.enquiry, mock: true });
  }
});

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { mockReviews, mockHealthData, mockPostIdeas } from '../data/mockGbp';

export const gbpRouter = Router();

// GET /gbp/reviews
gbpRouter.get('/reviews', (_req: Request, res: Response) => {
  res.json({ reviews: mockReviews, total: mockReviews.length });
});

// POST /gbp/reviews/:id/draft
gbpRouter.post('/reviews/:id/draft', async (req: Request, res: Response) => {
  const review = mockReviews.find(r => r.id === req.params.id);
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }

  const openclawUrl = process.env.OPENCLAW_URL || 'http://localhost:18789';
  try {
    const response = await axios.post(`${openclawUrl}/chat`, {
      message: `Write a professional, warm, 2-sentence reply to this Google review. Rating: ${review.rating}/5. Review: "${review.text}"`,
      personaId: 'gbp-manager', model: 'gpt-4o',
    }, { timeout: 20000 });
    res.json({ id: review.id, draft: response.data.reply || response.data.message });
  } catch {
    const drafts: Record<number, string> = {
      5: `Thank you so much for your wonderful ${review.rating}-star review, ${review.author}! We truly appreciate your kind words and look forward to serving you again.`,
      4: `Thank you for your great feedback, ${review.author}! We're delighted you had a positive experience and we'll use your comments to keep improving.`,
      3: `Thank you for your honest feedback, ${review.author}. We appreciate you taking the time and will work on the areas you mentioned.`,
      2: `We're sorry your experience didn't meet expectations, ${review.author}. Please contact us directly so we can make this right for you.`,
      1: `We sincerely apologise for your experience, ${review.author}. This is not the standard we hold ourselves to — please reach out directly so we can resolve this immediately.`,
    };
    res.json({ id: review.id, draft: drafts[review.rating] || drafts[3], mock: true });
  }
});

// POST /gbp/reviews/:id/send
gbpRouter.post('/reviews/:id/send', (req: Request, res: Response) => {
  const review = mockReviews.find(r => r.id === req.params.id);
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
  const { reply } = req.body;
  if (!reply) { res.status(400).json({ error: 'reply text required' }); return; }
  // In production: call Google My Business API here
  res.json({ success: true, id: review.id, message: 'Reply marked as sent (mock)' });
});

// GET /gbp/health
gbpRouter.get('/health', (_req: Request, res: Response) => {
  res.json(mockHealthData);
});

// GET /gbp/post-ideas
gbpRouter.get('/post-ideas', (_req: Request, res: Response) => {
  res.json({ ideas: mockPostIdeas });
});

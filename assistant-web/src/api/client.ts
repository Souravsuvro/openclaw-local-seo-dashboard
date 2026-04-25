import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE, timeout: 20000 });

export const gbpApi = {
  getReviews: () => api.get('/gbp/reviews'),
  draftReply: (id: string) => api.post(`/gbp/reviews/${id}/draft`),
  sendReply: (id: string, reply: string) => api.post(`/gbp/reviews/${id}/send`, { reply }),
  getHealth: () => api.get('/gbp/health'),
  getPostIdeas: () => api.get('/gbp/post-ideas'),
};

export const socialApi = {
  getInbox: (params?: Record<string, string>) => api.get('/social/inbox', { params }),
  handleItem: (id: string) => api.post(`/social/inbox/${id}/handle`),
  pushToCrm: (id: string) => api.post(`/social/inbox/${id}/crm`),
  draftReply: (id: string) => api.post(`/social/inbox/${id}/reply-draft`),
};

export const statusApi = {
  check: () => api.get('/status'),
};

export const chatApi = {
  send: (message: string, personaId?: string) => api.post('/chat', { message, personaId }),
};

export default api;

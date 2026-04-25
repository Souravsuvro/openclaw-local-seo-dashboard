export type IntentType = 'booking' | 'pricing' | 'complaint' | 'enquiry' | 'positive';
export type PlatformType = 'facebook' | 'instagram' | 'whatsapp' | 'google';

export interface InboxItem {
  id: string;
  platform: PlatformType;
  author: string;
  avatar: string;
  text: string;
  date: string;
  intent: IntentType;
  leadScore: number;
  handled: boolean;
  nextAction: string;
}

export const mockInboxItems: InboxItem[] = [
  {
    id: 'i1',
    platform: 'facebook',
    author: 'Marcus Bell',
    avatar: 'MB',
    text: 'Hi, how much is it for a return trip from Lingfield to Heathrow Terminal 5 next Friday morning?',
    date: '2026-04-25T09:14:00Z',
    intent: 'pricing',
    leadScore: 88,
    handled: false,
    nextAction: 'Send quote via DM within 10 minutes',
  },
  {
    id: 'i2',
    platform: 'instagram',
    author: 'Sophie Lane',
    avatar: 'SL',
    text: 'Saw your post — do you do wedding car hire? We need transport for 12 guests to a venue in Guildford.',
    date: '2026-04-25T08:50:00Z',
    intent: 'booking',
    leadScore: 95,
    handled: false,
    nextAction: 'High-value lead — call or DM immediately',
  },
  {
    id: 'i3',
    platform: 'whatsapp',
    author: 'Raj Patel',
    avatar: 'RP',
    text: 'The driver was really late yesterday and didn\'t apologise. Not happy at all.',
    date: '2026-04-24T22:30:00Z',
    intent: 'complaint',
    leadScore: 20,
    handled: false,
    nextAction: 'Apologise + offer discount on next booking',
  },
  {
    id: 'i4',
    platform: 'facebook',
    author: 'Linda Osei',
    avatar: 'LO',
    text: 'Do you cover Crawley to Gatwick? And is there a fixed price?',
    date: '2026-04-24T16:20:00Z',
    intent: 'enquiry',
    leadScore: 72,
    handled: false,
    nextAction: 'Reply with fixed-price info and booking link',
  },
  {
    id: 'i5',
    platform: 'google',
    author: 'Emily Forsyth',
    avatar: 'EF',
    text: 'Such a smooth and stress-free journey. The driver was polite and the car was spotless. Highly recommend Friends Cars!',
    date: '2026-04-24T12:05:00Z',
    intent: 'positive',
    leadScore: 40,
    handled: true,
    nextAction: 'Thank and ask for referral',
  },
  {
    id: 'i6',
    platform: 'instagram',
    author: 'Chris Nwamba',
    avatar: 'CN',
    text: 'Can I book a taxi for tonight at 11pm from Redhill to Horley? What\'s the price?',
    date: '2026-04-24T10:00:00Z',
    intent: 'booking',
    leadScore: 91,
    handled: false,
    nextAction: 'Confirm availability and quote immediately',
  },
];

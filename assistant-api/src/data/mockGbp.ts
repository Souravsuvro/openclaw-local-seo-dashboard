export interface GbpReview {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  replied: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
}

export const mockReviews: GbpReview[] = [
  {
    id: 'r1',
    author: 'James Thornton',
    avatar: 'JT',
    rating: 5,
    text: 'Absolutely brilliant service! The driver arrived early, was friendly and professional, and got us to the airport with plenty of time to spare. Will definitely book again.',
    date: '2026-04-24',
    replied: false,
    sentiment: 'positive',
    topics: ['punctuality', 'driver', 'airport'],
  },
  {
    id: 'r2',
    author: 'Priya Sharma',
    avatar: 'PS',
    rating: 4,
    text: 'Good reliable service. Car was clean and driver was polite. Only slight issue was the booking app was a bit slow but overall a great experience.',
    date: '2026-04-22',
    replied: true,
    sentiment: 'positive',
    topics: ['reliability', 'cleanliness', 'app'],
  },
  {
    id: 'r3',
    author: 'David Okafor',
    avatar: 'DO',
    rating: 3,
    text: 'Average experience. The driver was 10 minutes late and didn't help with luggage. Car was fine. Might try another service next time.',
    date: '2026-04-20',
    replied: false,
    sentiment: 'neutral',
    topics: ['punctuality', 'luggage', 'driver'],
  },
  {
    id: 'r4',
    author: 'Sarah Mitchell',
    avatar: 'SM',
    rating: 2,
    text: 'Waited 25 minutes past the scheduled pickup. Had to call three times. Not great when you have a flight to catch.',
    date: '2026-04-18',
    replied: false,
    sentiment: 'negative',
    topics: ['wait time', 'communication', 'airport'],
  },
  {
    id: 'r5',
    author: 'Tom Clarke',
    avatar: 'TC',
    rating: 5,
    text: 'Used Friends Cars for a corporate trip. Immaculate vehicle, super professional driver, on time. My go-to for all business travel now.',
    date: '2026-04-15',
    replied: true,
    sentiment: 'positive',
    topics: ['corporate', 'professionalism', 'vehicle'],
  },
  {
    id: 'r6',
    author: 'Aisha Rahman',
    avatar: 'AR',
    rating: 5,
    text: 'Fantastic! Booked for an early morning Gatwick run, the driver was waiting when I came out. Friendly chat, safe driving. 10/10.',
    date: '2026-04-10',
    replied: false,
    sentiment: 'positive',
    topics: ['airport', 'early morning', 'Gatwick'],
  },
];

export const mockHealthData = {
  score: 78,
  maxScore: 100,
  checks: [
    { label: 'Business name', status: 'pass', detail: 'Friends Cars — correct' },
    { label: 'Address & NAP', status: 'pass', detail: 'Consistent across profile' },
    { label: 'Primary category', status: 'pass', detail: 'Taxi service' },
    { label: 'Service areas', status: 'warn', detail: 'Only 3 areas listed — add more' },
    { label: 'Business hours', status: 'pass', detail: '24/7 marked correctly' },
    { label: 'Phone number', status: 'pass', detail: 'Verified' },
    { label: 'Website link', status: 'pass', detail: 'friendscars.co.uk' },
    { label: 'Profile photos', status: 'warn', detail: '4 photos — aim for 10+' },
    { label: 'Recent GBP post', status: 'fail', detail: 'Last post was 14 days ago — post weekly' },
    { label: 'Review response rate', status: 'warn', detail: '60% replied — aim for 100%' },
    { label: 'Q&A section', status: 'fail', detail: 'No questions answered yet' },
    { label: 'Booking link', status: 'pass', detail: 'Linked to booking page' },
  ],
};

export const mockPostIdeas = [
  {
    id: 'p1',
    type: 'offer',
    title: 'Book your summer airport transfer early',
    body: 'Summer holidays are coming! Book your Gatwick, Heathrow, or Stansted transfer with Friends Cars now and get reliable, door-to-door service from East Surrey. Available 24/7.',
    cta: 'Book Now',
    tags: ['#AirportTransfer', '#EastSurrey', '#SummerTravel'],
  },
  {
    id: 'p2',
    type: 'update',
    title: 'New: Corporate account bookings',
    body: 'Friends Cars now offers corporate account invoicing for local businesses. Seamless billing, priority dispatch, and professional drivers — perfect for client pickups and business travel.',
    cta: 'Learn More',
    tags: ['#CorporateTravel', '#TaxiSurrey', '#BusinessTravel'],
  },
  {
    id: 'p3',
    type: 'faq',
    title: 'Q: Do you cover late-night pickups?',
    body: 'Yes! Friends Cars operates 24 hours a day, 7 days a week — including bank holidays. No matter what time your flight lands, we will be there.',
    cta: 'See All Services',
    tags: ['#24HourTaxi', '#LateNight', '#Lingfield'],
  },
];

# Phase 1: Foundation & Architecture - Complete Implementation Guide

## Overview
This guide provides step-by-step instructions to establish the production-ready foundation for the OpenClaw platform. Estimated duration: **4 weeks**.

---

## Part 1: Project Structure & Setup

### Step 1: Update Root package.json

```json
{
  "name": "openclaw-local-seo-dashboard",
  "version": "3.0.0",
  "private": true,
  "description": "Enterprise Local SEO & Digital Marketing Platform",
  "author": "OpenClaw Team",
  "workspaces": [
    "packages/api",
    "packages/web",
    "packages/shared"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "dev:api": "npm run dev --workspace=packages/api",
    "dev:web": "npm run dev --workspace=packages/web",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "setup": "npm install && npm run migrate:dev",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  },
  "devDependencies": {
    "prettier": "^3.0.0",
    "eslint": "^8.54.0",
    "typescript": "^5.3.3"
  }
}
```

### Step 2: Create Directory Structure

```bash
openclaw-local-seo-dashboard/
├── packages/
│   ├── api/
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── config/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   ├── queues/
│   │   │   └── types/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── jest.config.js
│   ├── web/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── context/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── styles/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   ├── constants/
│       │   └── utils/
│       └── package.json
├── docker-compose.yml
├── .env.example
├── ROADMAP.md
└── README.md
```

---

## Part 2: Database Setup

### Step 1: Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: openclaw-postgres
    environment:
      POSTGRES_USER: ${DB_USER:-openclaw}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secure_password_123}
      POSTGRES_DB: ${DB_NAME:-openclaw_dev}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-openclaw}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: openclaw-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongodb:
    image: mongo:6-alpine
    container_name: openclaw-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-secure_password_123}
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  mongodb_data:
```

### Step 2: Environment Variables

Create `.env.example`:

```dotenv
# Server
PORT=4000
NODE_ENV=development
API_URL=http://localhost:4000
WEB_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://openclaw:secure_password_123@localhost:5432/openclaw_dev
DB_USER=openclaw
DB_PASSWORD=secure_password_123
DB_NAME=openclaw_dev

# Redis
REDIS_URL=redis://localhost:6379

# MongoDB
MONGO_URL=mongodb://admin:secure_password_123@localhost:27017/openclaw_dev?authSource=admin
MONGO_USER=admin
MONGO_PASSWORD=secure_password_123

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars_long_here_12345
JWT_EXPIRE=7d

# OAuth (Setup in respective dashboards)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# External APIs
OPENCLAW_URL=http://localhost:18789
OPENCLAW_API_KEY=your_api_key

# GBP Integration
GBP_LOCATION_ID=your_gbp_location_id
GBP_ACCESS_TOKEN=your_gbp_access_token

# Social Media
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_PAGE_TOKEN=your_page_token

# Monitoring
SENTRY_DSN=https://your_sentry_dsn
DATADOG_API_KEY=your_datadog_api_key

# Email (For notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Step 3: Prisma Schema

Create `packages/api/prisma/schema.prisma`:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTH & USER ====================
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String
  firstName         String?
  lastName          String?
  avatar            String?
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  
  // Account
  role              UserRole  @default(VIEWER)
  subscription      Subscription?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  // Relations
  locations         Location[]
  teams             TeamMember[]
  auditLogs         AuditLog[]
  integrations      Integration[]
  
  @@index([email])
  @@index([createdAt])
}

enum UserRole {
  ADMIN
  MANAGER
  TEAM_LEAD
  AGENT
  VIEWER
}

model Subscription {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  plan              PricingTier
  status            SubscriptionStatus @default(ACTIVE)
  autoRenew         Boolean   @default(true)
  
  currentPeriodStart DateTime
  currentPeriodEnd  DateTime
  cancelAt          DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
}

enum PricingTier {
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  SUSPENDED
}

// ==================== LOCATIONS ====================
model Location {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Business Info
  businessName      String
  description       String?
  address           String
  city              String
  state             String
  zipCode           String
  country           String
  phone             String?
  website           String?
  email             String?
  
  // GBP Integration
  gbpLocationId     String?
  gbpAccessToken    String?
  gbpTokenExpiry    DateTime?
  gbpSyncStatus     SyncStatus @default(PENDING)
  gbpLastSyncAt     DateTime?
  
  // Metadata
  timezone          String    @default("UTC")
  language          String    @default("en")
  logo              String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  reviews           Review[]
  socialInboxes     SocialInbox[]
  leads             Lead[]
  teams             TeamLocation[]
  integrations      LocationIntegration[]
  
  @@index([userId])
  @@index([businessName])
  @@unique([userId, businessName])
}

enum SyncStatus {
  PENDING
  SYNCING
  SYNCED
  ERROR
  FAILED
}

// ==================== REVIEWS ====================
model Review {
  id                String    @id @default(cuid())
  locationId        String
  location          Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  // Review Data
  externalId        String    // Google review ID
  platform          ReviewPlatform
  rating            Int       // 1-5
  title             String?
  text              String
  
  // Author
  authorName        String
  authorEmail       String?
  authorPhone       String?
  authorAvatar      String?
  authorUrl         String?
  
  // Sentiment & Topics
  sentiment         Sentiment
  topics            String[]  @default([])
  language          String    @default("en")
  
  // Response
  hasResponse       Boolean   @default(false)
  response          String?
  respondedAt       DateTime?
  responseAuthor    String?
  
  // Metadata
  images            String[]  @default([])
  helpful           Int       @default(0)
  
  createdAt         DateTime
  updatedAt         DateTime  @updatedAt
  syncedAt          DateTime  @default(now())
  
  @@index([locationId])
  @@index([externalId])
  @@index([platform])
  @@index([sentiment])
  @@index([createdAt])
  @@unique([locationId, externalId, platform])
}

enum ReviewPlatform {
  GOOGLE
  FACEBOOK
  TRUSTPILOT
  GOOGLE_REVIEWS
  YELP
}

enum Sentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
}

// ==================== SOCIAL INBOX ====================
model SocialInbox {
  id                String    @id @default(cuid())
  locationId        String
  location          Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  // Message Data
  externalId        String    // Platform message ID
  platform          SocialPlatform
  conversationId    String
  
  // Author
  authorName        String
  authorId          String
  authorAvatar      String?
  authorUrl         String?
  
  // Content
  text              String
  attachments       String[]  @default([])
  
  // Classification
  intent            MessageIntent
  sentiment         Sentiment
  leadScore         Int       @default(0) // 0-100
  
  // Action
  status            InboxStatus @default(UNREAD)
  assignedTo        String?   // User ID
  response          String?
  respondedAt       DateTime?
  crm_synced        Boolean   @default(false)
  crm_sync_id       String?   // HubSpot/Mautic ID
  
  // Metadata
  language          String    @default("en")
  conversationHistory String? // JSON array of previous messages
  
  createdAt         DateTime
  updatedAt         DateTime  @updatedAt
  
  @@index([locationId])
  @@index([platform])
  @@index([intent])
  @@index([status])
  @@index([assignedTo])
  @@index([createdAt])
}

enum SocialPlatform {
  FACEBOOK
  INSTAGRAM
  TWITTER
  TIKTOK
  LINKEDIN
  YOUTUBE
  WHATSAPP
}

enum MessageIntent {
  BOOKING
  PRICING
  COMPLAINT
  ENQUIRY
  POSITIVE
  QUESTION
  OTHER
}

enum InboxStatus {
  UNREAD
  READ
  RESPONDED
  ARCHIVED
}

// ==================== LEADS ====================
model Lead {
  id                String    @id @default(cuid())
  locationId        String
  location          Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  // Lead Info
  name              String
  email             String?
  phone             String?
  company           String?
  
  // Lead Source
  source            LeadSource
  sourceId          String?   // Social inbox ID or review ID
  
  // Lead Quality
  score             Int       @default(0)
  status            LeadStatus @default(NEW)
  priority          LeadPriority @default(MEDIUM)
  
  // CRM Integration
  crm_provider      CRMProvider?
  crm_id            String?   // HubSpot contact ID, etc
  crm_synced        Boolean   @default(false)
  crm_sync_error    String?
  
  // Notes
  notes             String?
  tags              String[]  @default([])
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  closedAt          DateTime?
  
  @@index([locationId])
  @@index([source])
  @@index([status])
  @@index([crm_id])
  @@index([createdAt])
}

enum LeadSource {
  SOCIAL_INBOX
  REVIEW
  GBP_INQUIRY
  WEBSITE
  MANUAL
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  NEGOTIATION
  CONVERTED
  REJECTED
}

enum LeadPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum CRMProvider {
  HUBSPOT
  MAUTIC
  ZOHO
  PIPEDRIVE
  FRESHSALES
}

// ==================== INTEGRATIONS ====================
model Integration {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  provider          IntegrationProvider
  status            IntegrationStatus @default(ACTIVE)
  
  // OAuth/Credentials
  accessToken       String?
  refreshToken      String?
  tokenExpiry       DateTime?
  secrets           Json?     // Encrypted secrets
  
  lastSyncAt        DateTime?
  lastError         String?
  errorCount        Int       @default(0)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
  @@index([provider])
  @@unique([userId, provider])
}

model LocationIntegration {
  id                String    @id @default(cuid())
  locationId        String
  location          Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  provider          IntegrationProvider
  status            IntegrationStatus @default(ACTIVE)
  
  // OAuth/Credentials
  accessToken       String?
  refreshToken      String?
  tokenExpiry       DateTime?
  
  // Settings
  settings          Json?     // Integration-specific settings
  
  lastSyncAt        DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([locationId])
  @@unique([locationId, provider])
}

enum IntegrationProvider {
  GOOGLE
  FACEBOOK
  INSTAGRAM
  TWITTER
  HUBSPOT
  MAUTIC
  ZOHO
  PIPEDRIVE
  OPENAI
  STRIPE
}

enum IntegrationStatus {
  ACTIVE
  INACTIVE
  ERROR
  EXPIRED
}

// ==================== TEAMS ====================
model Team {
  id                String    @id @default(cuid())
  name              String
  createdAt         DateTime  @default(now())
  
  members           TeamMember[]
  locations         TeamLocation[]
}

model TeamMember {
  id                String    @id @default(cuid())
  teamId            String
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  role              TeamRole
  
  createdAt         DateTime  @default(now())
  
  @@unique([teamId, userId])
}

enum TeamRole {
  OWNER
  MANAGER
  MEMBER
}

model TeamLocation {
  id                String    @id @default(cuid())
  teamId            String
  locationId        String
  location          Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  @@unique([teamId, locationId])
}

// ==================== AUDIT & COMPLIANCE ====================
model AuditLog {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  action            String    // e.g., "REVIEW_REPLIED", "LEAD_CREATED"
  resource          String    // e.g., "Review", "Lead"
  resourceId        String
  
  changes           Json?     // Before/after values
  ipAddress         String?
  userAgent         String?
  
  createdAt         DateTime  @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// ==================== ANALYTICS ====================
model AnalyticsEvent {
  id                String    @id @default(cuid())
  userId            String
  
  event             String    // e.g., "review_viewed", "lead_created"
  properties        Json?
  
  createdAt         DateTime  @default(now())
  
  @@index([userId])
  @@index([event])
  @@index([createdAt])
}
```

### Step 4: Setup Database Migrations

Create `packages/api/prisma/.env`:

```bash
DATABASE_URL="postgresql://openclaw:secure_password_123@localhost:5432/openclaw_dev"
```

Commands:
```bash
cd packages/api

# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database (we'll create a seed file next)
npx prisma db seed
```

---

## Part 3: Backend Structure

### Step 1: Update Backend package.json

Create `packages/api/package.json`:

```json
{
  "name": "openclaw-api",
  "version": "3.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "migrate:dev": "prisma migrate dev",
    "migrate:prod": "prisma migrate deploy",
    "seed": "ts-node src/scripts/seed.ts",
    "lint": "eslint src"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0",
    "axios": "^1.6.2",
    "jsonwebtoken": "^9.1.0",
    "bcrypt": "^5.1.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-google-oauth20": "^2.0.0",
    "uuid": "^9.0.1",
    "zod": "^3.22.4",
    "bullmq": "^5.0.0",
    "redis": "^4.6.11",
    "ioredis": "^5.3.2",
    "pino": "^8.17.2",
    "pino-http": "^8.6.0",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.11"
  }
}
```

### Step 2: Core Server File

Create `packages/api/src/server.ts`:

```typescript
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import routes
import { authRoutes } from './routes/auth';
import { locationsRoutes } from './routes/locations';
import { reviewsRoutes } from './routes/reviews';
import { socialRoutes } from './routes/social';
import { leadsRoutes } from './routes/leads';
import { integrationsRoutes } from './routes/integrations';
import { analyticsRoutes } from './routes/analytics';
import { statusRoutes } from './routes/status';

const app: Express = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use(requestLogger);

// ==================== ROUTES ====================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/status', statusRoutes);

// ==================== ERROR HANDLING ====================

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

server.listen(PORT, () => {
  logger.info(`🚀 OpenClaw API running at http://localhost:${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV}`);
  logger.info(`   Database: ${process.env.DATABASE_URL?.split('@')[1]}`);
  logger.info(`   Redis: ${process.env.REDIS_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
```

### Step 3: Create Middleware

Create `packages/api/src/middleware/requestLogger.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};
```

Create `packages/api/src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
};
```

### Step 4: Create Utilities

Create `packages/api/src/utils/logger.ts`:

```typescript
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino(
  isProduction
    ? undefined
    : {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        },
      },
);
```

---

## Part 4: Frontend Structure

### Step 1: Update Frontend package.json

Create `packages/web/package.json`:

```json
{
  "name": "openclaw-web",
  "version": "3.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.2",
    "axios": "^1.6.2",
    "lucide-react": "^0.344.0",
    "clsx": "^2.0.0",
    "tailwindcss": "^3.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}
```

### Step 2: Frontend Entry Point

Create `packages/web/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

### Step 3: Create API Client

Create `packages/web/src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

---

## Part 5: Type Definitions

Create `packages/shared/src/types/index.ts`:

```typescript
// Auth
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'TEAM_LEAD' | 'AGENT' | 'VIEWER';
  createdAt: string;
}

// Location
export interface Location {
  id: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  website?: string;
  gbpLocationId?: string;
  gbpSyncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';
  createdAt: string;
}

// Review
export interface Review {
  id: string;
  locationId: string;
  externalId: string;
  platform: 'GOOGLE' | 'FACEBOOK' | 'TRUSTPILOT';
  rating: number;
  text: string;
  authorName: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  hasResponse: boolean;
  response?: string;
  createdAt: string;
}

// Social Inbox
export interface SocialMessage {
  id: string;
  locationId: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN';
  authorName: string;
  text: string;
  intent: 'BOOKING' | 'PRICING' | 'COMPLAINT' | 'ENQUIRY' | 'POSITIVE';
  leadScore: number;
  status: 'UNREAD' | 'READ' | 'RESPONDED';
  createdAt: string;
}

// Lead
export interface Lead {
  id: string;
  locationId: string;
  name: string;
  email?: string;
  phone?: string;
  source: 'SOCIAL_INBOX' | 'REVIEW' | 'GBP_INQUIRY';
  score: number;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED';
  createdAt: string;
}
```

---

## Next Steps

Once you've completed this guide:

1. **Run the infrastructure:**
   ```bash
   docker-compose up -d
   npm run setup
   ```

2. **Generate Prisma Client:**
   ```bash
   cd packages/api
   npx prisma generate
   ```

3. **Start development:**
   ```bash
   npm run dev:api  # Terminal 1
   npm run dev:web  # Terminal 2
   ```

4. **Verify setup:**
   ```bash
   curl http://localhost:4000  # API health
   curl http://localhost:5173  # Frontend
   ```

**Continue with Part 2: Core Routes & Controllers Implementation** (next document)

---

**Status:** Phase 1 - Part 1-4 Complete
**Estimated Time:** 5-7 days
**Next Milestone:** Core API routes and controllers

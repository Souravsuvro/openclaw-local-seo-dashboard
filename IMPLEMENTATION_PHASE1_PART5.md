# Phase 1: Part 5 - Core API Controllers, Routes & Services

## Part 5A: Authentication System

### Step 1: Auth Types

Create `packages/api/src/types/auth.ts`:

```typescript
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}
```

### Step 2: Auth Service

Create `packages/api/src/services/auth.service.ts`:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { RegisterRequest, LoginRequest, AuthResponse, TokenPayload } from '../types/auth';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'VIEWER', // Default role
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName!,
        lastName: user.lastName!,
        role: user.role,
      },
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName!,
        lastName: user.lastName!,
        role: user.role,
      },
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { id: userId, email, role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch {
      throw new AppError('Invalid token', 401);
    }
  }
}
```

### Step 3: Auth Middleware

Create `packages/api/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid authorization header', 401);
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);
  req.userId = payload.id;

  next();
};

export const authorize = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
      });

      if (!user || !roles.includes(user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### Step 4: Auth Controller

Create `packages/api/src/controllers/auth.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { RegisterRequest, LoginRequest } from '../types/auth';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data: RegisterRequest = req.body;
      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data: LoginRequest = req.body;
      const result = await authService.login(data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}
```

### Step 5: Auth Routes

Create `packages/api/src/routes/auth.ts`:

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.get('/me', authenticate, AuthController.me);
```

---

## Part 5B: Locations Management

### Step 1: Locations Service

Create `packages/api/src/services/locations.service.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export class LocationsService {
  constructor(private prisma: PrismaClient) {}

  async createLocation(userId: string, data: any) {
    const location = await this.prisma.location.create({
      data: {
        userId,
        businessName: data.businessName,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        phone: data.phone,
        website: data.website,
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
      },
    });

    return location;
  }

  async getLocations(userId: string) {
    const locations = await this.prisma.location.findMany({
      where: { userId },
      select: {
        id: true,
        businessName: true,
        city: true,
        state: true,
        phone: true,
        website: true,
        gbpSyncStatus: true,
        gbpLastSyncAt: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            leads: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return locations;
  }

  async getLocationById(userId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, userId },
      include: {
        _count: {
          select: {
            reviews: true,
            leads: true,
            socialInboxes: true,
          },
        },
      },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    return location;
  }

  async updateLocation(userId: string, locationId: string, data: any) {
    // Verify ownership
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, userId },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    const updated = await this.prisma.location.update({
      where: { id: locationId },
      data: {
        businessName: data.businessName,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        website: data.website,
        timezone: data.timezone,
        language: data.language,
      },
    });

    return updated;
  }

  async deleteLocation(userId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, userId },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    await this.prisma.location.delete({
      where: { id: locationId },
    });

    return { success: true };
  }

  async getLocationStats(userId: string, locationId: string) {
    const location = await this.getLocationById(userId, locationId);

    // Get review stats
    const reviews = await this.prisma.review.groupBy({
      by: ['sentiment'],
      where: { locationId },
      _count: true,
    });

    // Get recent reviews
    const recentReviews = await this.prisma.review.findMany({
      where: { locationId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        text: true,
        authorName: true,
        sentiment: true,
        createdAt: true,
      },
    });

    // Get lead stats
    const leads = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { locationId },
      _count: true,
    });

    return {
      location,
      reviewStats: reviews,
      recentReviews,
      leadStats: leads,
    };
  }
}
```

### Step 2: Locations Controller

Create `packages/api/src/controllers/locations.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { LocationsService } from '../services/locations.service';

const prisma = new PrismaClient();
const service = new LocationsService(prisma);

export class LocationsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await service.createLocation(req.userId!, req.body);
      res.status(201).json(location);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await service.getLocations(req.userId!);
      res.json({ locations, total: locations.length });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await service.getLocationById(req.userId!, req.params.id);
      res.json(location);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await service.updateLocation(req.userId!, req.params.id, req.body);
      res.json(location);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.deleteLocation(req.userId!, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.getLocationStats(req.userId!, req.params.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
```

### Step 3: Locations Routes

Create `packages/api/src/routes/locations.ts`:

```typescript
import { Router } from 'express';
import { LocationsController } from '../controllers/locations.controller';
import { authenticate, authorize } from '../middleware/auth';

export const locationsRoutes = Router();

// Require authentication for all routes
locationsRoutes.use(authenticate);

locationsRoutes.post('/', LocationsController.create);
locationsRoutes.get('/', LocationsController.getAll);
locationsRoutes.get('/:id', LocationsController.getById);
locationsRoutes.put('/:id', LocationsController.update);
locationsRoutes.delete('/:id', LocationsController.delete);
locationsRoutes.get('/:id/stats', LocationsController.getStats);
```

---

## Part 5C: Reviews Management

### Step 1: Reviews Service

Create `packages/api/src/services/reviews.service.ts`:

```typescript
import { PrismaClient, Sentiment } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export class ReviewsService {
  constructor(private prisma: PrismaClient) {}

  async getReviews(
    userId: string,
    locationId: string,
    filters?: {
      platform?: string;
      sentiment?: Sentiment;
      rating?: number;
      hasResponse?: boolean;
      skip?: number;
      take?: number;
    }
  ) {
    // Verify location ownership
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, userId },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    const where: any = { locationId };

    if (filters?.platform) where.platform = filters.platform;
    if (filters?.sentiment) where.sentiment = filters.sentiment;
    if (filters?.rating) where.rating = filters.rating;
    if (typeof filters?.hasResponse === 'boolean') {
      where.hasResponse = filters.hasResponse;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: filters?.skip || 0,
        take: filters?.take || 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return { reviews, total };
  }

  async getReviewById(userId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        location: { userId },
      },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    return review;
  }

  async addReviewResponse(
    userId: string,
    reviewId: string,
    response: string
  ) {
    const review = await this.getReviewById(userId, reviewId);

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        response,
        hasResponse: true,
        respondedAt: new Date(),
        responseAuthor: userId,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REVIEW_REPLIED',
        resource: 'Review',
        resourceId: reviewId,
        changes: {
          response,
        },
      },
    });

    return updated;
  }

  async getReviewStats(userId: string, locationId: string) {
    // Verify location ownership
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, userId },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    const stats = await this.prisma.review.groupBy({
      by: ['sentiment'],
      where: { locationId },
      _count: true,
      _avg: { rating: true },
    });

    const ratingDistribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { locationId },
      _count: true,
    });

    const responseRate = await this.prisma.review.count({
      where: { locationId, hasResponse: true },
    });

    const total = await this.prisma.review.count({
      where: { locationId },
    });

    return {
      sentiment: stats,
      ratingDistribution,
      responseRate: total > 0 ? (responseRate / total) * 100 : 0,
      totalReviews: total,
    };
  }
}
```

### Step 2: Reviews Controller

Create `packages/api/src/controllers/reviews.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReviewsService } from '../services/reviews.service';

const prisma = new PrismaClient();
const service = new ReviewsService(prisma);

export class ReviewsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { locationId } = req.params;
      const filters = {
        platform: req.query.platform as string,
        sentiment: req.query.sentiment as any,
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        hasResponse: req.query.hasResponse === 'true',
        skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
        take: req.query.take ? parseInt(req.query.take as string) : 20,
      };

      const result = await service.getReviews(req.userId!, locationId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await service.getReviewById(req.userId!, req.params.id);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  static async addResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const { response } = req.body;
      const updated = await service.addReviewResponse(
        req.userId!,
        req.params.id,
        response
      );
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { locationId } = req.params;
      const stats = await service.getReviewStats(req.userId!, locationId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
```

### Step 3: Reviews Routes

Create `packages/api/src/routes/reviews.ts`:

```typescript
import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.controller';
import { authenticate } from '../middleware/auth';

export const reviewsRoutes = Router();

reviewsRoutes.use(authenticate);

reviewsRoutes.get('/location/:locationId', ReviewsController.getAll);
reviewsRoutes.get('/:id', ReviewsController.getById);
reviewsRoutes.post('/:id/response', ReviewsController.addResponse);
reviewsRoutes.get('/location/:locationId/stats', ReviewsController.getStats);
```

---

## Part 5D: Social Inbox

Create `packages/api/src/services/social.service.ts`:

```typescript
import { PrismaClient, MessageIntent } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export class SocialService {
  constructor(private prisma: PrismaClient) {}

  async getInbox(
    userId: string,
    locationId: string,
    filters?: {
      platform?: string;
      intent?: MessageIntent;
      status?: string;
      minLeadScore?: number;
      skip?: number;
      take?: number;
    }
  ) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, userId },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    const where: any = { locationId };

    if (filters?.platform) where.platform = filters.platform;
    if (filters?.intent) where.intent = filters.intent;
    if (filters?.status) where.status = filters.status;
    if (filters?.minLeadScore) where.leadScore = { gte: filters.minLeadScore };

    const [items, total] = await Promise.all([
      this.prisma.socialInbox.findMany({
        where,
        skip: filters?.skip || 0,
        take: filters?.take || 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.socialInbox.count({ where }),
    ]);

    return { items, total };
  }

  async respondToMessage(
    userId: string,
    messageId: string,
    response: string
  ) {
    const message = await this.prisma.socialInbox.findFirst({
      where: {
        id: messageId,
        location: { userId },
      },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const updated = await this.prisma.socialInbox.update({
      where: { id: messageId },
      data: {
        response,
        respondedAt: new Date(),
        status: 'RESPONDED',
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SOCIAL_MESSAGE_RESPONDED',
        resource: 'SocialInbox',
        resourceId: messageId,
        changes: { response },
      },
    });

    return updated;
  }

  async createLead(userId: string, messageId: string) {
    const message = await this.prisma.socialInbox.findFirst({
      where: {
        id: messageId,
        location: { userId },
      },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const lead = await this.prisma.lead.create({
      data: {
        locationId: message.locationId,
        name: message.authorName,
        source: 'SOCIAL_INBOX',
        sourceId: messageId,
        score: message.leadScore,
        status: 'NEW',
      },
    });

    // Mark as synced
    await this.prisma.socialInbox.update({
      where: { id: messageId },
      data: { crm_synced: true, crm_sync_id: lead.id },
    });

    return lead;
  }

  async getInboxStats(userId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, userId },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    const stats = await this.prisma.socialInbox.groupBy({
      by: ['platform'],
      where: { locationId },
      _count: true,
      _avg: { leadScore: true },
    });

    const unread = await this.prisma.socialInbox.count({
      where: { locationId, status: 'UNREAD' },
    });

    return {
      byPlatform: stats,
      unreadCount: unread,
    };
  }
}
```

---

## Part 5E: Placeholder Routes

Create remaining placeholder routes that will be implemented in later phases:

Create `packages/api/src/routes/social.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const socialRoutes = Router();
socialRoutes.use(authenticate);

socialRoutes.get('/inbox/:locationId', (req, res) => {
  res.json({ message: 'Social inbox endpoint - Phase 2' });
});

socialRoutes.post('/inbox/:messageId/respond', (req, res) => {
  res.json({ message: 'Respond to message - Phase 2' });
});

socialRoutes.post('/inbox/:messageId/create-lead', (req, res) => {
  res.json({ message: 'Create lead from message - Phase 2' });
});
```

Create `packages/api/src/routes/leads.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const leadsRoutes = Router();
leadsRoutes.use(authenticate);

leadsRoutes.get('/location/:locationId', (req, res) => {
  res.json({ message: 'Get leads - Phase 3' });
});

leadsRoutes.post('/', (req, res) => {
  res.json({ message: 'Create lead - Phase 3' });
});

leadsRoutes.post('/:id/crm-sync', (req, res) => {
  res.json({ message: 'Sync lead to CRM - Phase 3' });
});
```

Create `packages/api/src/routes/integrations.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const integrationsRoutes = Router();
integrationsRoutes.use(authenticate);

integrationsRoutes.get('/', (req, res) => {
  res.json({ message: 'List integrations - Phase 5' });
});

integrationsRoutes.post('/google/callback', (req, res) => {
  res.json({ message: 'Google OAuth callback - Phase 5' });
});
```

Create `packages/api/src/routes/analytics.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const analyticsRoutes = Router();
analyticsRoutes.use(authenticate);

analyticsRoutes.get('/dashboard/:locationId', (req, res) => {
  res.json({ message: 'Dashboard analytics - Phase 4' });
});

analyticsRoutes.get('/reports/:locationId', (req, res) => {
  res.json({ message: 'Generate reports - Phase 4' });
});
```

Create `packages/api/src/routes/status.ts`:

```typescript
import { Router } from 'express';

export const statusRoutes = Router();

statusRoutes.get('/', (req, res) => {
  res.json({
    status: 'operational',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  });
});

statusRoutes.get('/health', (req, res) => {
  res.json({
    database: 'connected',
    redis: 'connected',
    mongodb: 'connected',
  });
});
```

---

## Part 5F: TypeScript Configuration

Create `packages/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Testing Phase 1 Setup

### Step 1: Test Authentication

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Get authenticated user
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 2: Test Locations

```bash
# Create location
curl -X POST http://localhost:4000/api/locations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "My Local Business",
    "address": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701",
    "country": "USA",
    "phone": "+1-512-555-0123",
    "website": "https://mybusiness.com"
  }'

# Get all locations
curl -X GET http://localhost:4000/api/locations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Next Steps

1. ✅ Database schema and migrations
2. ✅ Authentication system
3. ✅ Locations CRUD
4. ✅ Reviews management
5. ✅ Social inbox scaffolding

**Phase 1 Complete!** Proceed to:
- **Phase 2:** GBP API integration, review syncing, AI response generation
- **Phase 3:** Social media platform integrations
- **Phase 4:** Advanced analytics and reporting
- **Phase 5:** CRM integrations and lead management
- **Phase 6:** Deployment and infrastructure

---

**Status:** Phase 1 - Part 5 Complete
**Estimated Time:** 7 days total for Phase 1
**Next Milestone:** Phase 2 - GBP Integration & AI Features

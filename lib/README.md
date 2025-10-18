# Library Layer Documentation

The `lib/` folder is the **core business logic layer** of the SaaS application. It contains all the essential functionality for database operations, authentication, payments, and utilities. This is where the "magic happens" behind the scenes.

## 📁 Complete Folder Structure

```
lib/
├── auth/           # Authentication & authorization
│   ├── session.ts     # Password hashing, JWT tokens, sessions
│   ├── middleware.ts  # Server action middleware with validation
│   └── README.md     # Auth documentation
├── db/             # Database layer
│   ├── schema.ts       # Database table definitions
│   ├── drizzle.ts      # Database connection setup
│   ├── queries.ts      # Database query functions
│   ├── seed.ts         # Database seeding script
│   ├── setup.ts        # Development environment setup
│   ├── migrations/      # Database migration files
│   └── README.md       # Database documentation
├── payments/       # Stripe payment integration
│   ├── stripe.ts       # Core Stripe API integration
│   ├── actions.ts      # Payment server actions
│   └── README.md      # Payments documentation
├── utils.ts        # Common utility functions
└── README.md       # This documentation
```

## 🏗️ Architecture Overview

### Layer Separation
```
┌─────────────────────────────────────┐
│           Frontend (UI)             │ ← React components, pages
├─────────────────────────────────────┤
│           API Routes                │ ← Next.js API endpoints
├─────────────────────────────────────┤
│           Library Layer             │ ← THIS FOLDER (lib/)
│  ┌─────────┬─────────┬─────────┐   │
│  │  Auth   │   DB    │Payments │   │
│  └─────────┴─────────┴─────────┘   │
├─────────────────────────────────────┤
│        External Services           │ ← Stripe, PostgreSQL
└─────────────────────────────────────┘
```

### Data Flow
```
User Action → API Route → Library Function → Database/Stripe → Response
```

## 🔧 Core Components Explained

### 1. **Authentication (`/auth/`)**
**Purpose**: Secure user authentication and session management

**Key Features**:
- Password hashing with bcrypt
- JWT token creation and verification
- Secure cookie management
- Server action middleware
- Team-based authorization

**Files**:
- `session.ts` - Core auth functions (hash, verify, sessions)
- `middleware.ts` - Higher-order functions for server actions

### 2. **Database (`/db/`)**
**Purpose**: All database operations and data management

**Key Features**:
- Type-safe database queries with Drizzle ORM
- PostgreSQL connection management
- Database migrations
- Query functions for business logic
- Development seeding

**Files**:
- `schema.ts` - Database table definitions
- `drizzle.ts` - Database connection
- `queries.ts` - Business logic queries
- `seed.ts` - Development data seeding
- `setup.ts` - Environment setup

### 3. **Payments (`/payments/`)**
**Purpose**: Stripe payment integration and subscription management

**Key Features**:
- Stripe checkout sessions
- Customer portal access
- Webhook event handling
- Subscription lifecycle management
- Product and pricing management

**Files**:
- `stripe.ts` - Core Stripe API integration
- `actions.ts` - Payment server actions

### 4. **Utilities (`utils.ts`)**
**Purpose**: Common helper functions used throughout the app

**Key Features**:
- CSS class merging for Tailwind
- Conditional styling utilities
- Reusable helper functions

## 🚀 How It All Works Together

### User Registration Flow
```
1. User submits form → API route
2. API calls auth/session.ts → hashPassword()
3. API calls db/queries.ts → createUser()
4. API calls auth/session.ts → setSession()
5. User redirected to dashboard
```

### Subscription Purchase Flow
```
1. User clicks "Subscribe" → API route
2. API calls payments/actions.ts → checkoutAction()
3. Action calls payments/stripe.ts → createCheckoutSession()
4. User redirected to Stripe → completes payment
5. Stripe webhook → payments/stripe.ts → handleSubscriptionChange()
6. Database updated → user returns to app
```

### Protected Route Access
```
1. User visits protected page → middleware
2. Middleware calls auth/session.ts → getSession()
3. Middleware calls db/queries.ts → getUser()
4. If authenticated → allow access
5. If not authenticated → redirect to login
```

## 💡 Common Usage Patterns

### Database Operations
```typescript
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

// Get current user
const user = await getUser();

// Create new record
const [newUser] = await db.insert(users).values({
  email: 'user@example.com',
  passwordHash: hashedPassword
}).returning();
```

### Authentication
```typescript
import { hashPassword, setSession } from '@/lib/auth/session';
import { validatedActionWithUser } from '@/lib/auth/middleware';

// Hash password
const hashedPassword = await hashPassword(password);

// Create protected action
const updateProfile = validatedActionWithUser(
  z.object({ name: z.string() }),
  async (data, formData, user) => {
    // user is guaranteed to be authenticated
    return await updateUser(user.id, data);
  }
);
```

### Payments
```typescript
import { checkoutAction, customerPortalAction } from '@/lib/payments/actions';

// In React component
<form action={checkoutAction}>
  <input type="hidden" name="priceId" value="price_123" />
  <button type="submit">Subscribe</button>
</form>
```

### Styling
```typescript
import { cn } from '@/lib/utils';

// Conditional styling
<button className={cn(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500 text-white',
  isDisabled && 'opacity-50'
)}>
  Click me
</button>
```

## 🔒 Security Architecture

### Authentication Security
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens signed with secret key
- HttpOnly cookies prevent XSS
- Secure cookies for HTTPS
- Session expiration (24 hours)

### Database Security
- Parameterized queries prevent SQL injection
- Type-safe operations with Drizzle ORM
- Environment variables for secrets
- Connection pooling for performance

### Payment Security
- Server-side payment processing
- Stripe handles PCI compliance
- Webhook signature verification
- Secure redirect URLs
- Customer data encryption

## 🧪 Testing Strategy

### Unit Testing
```typescript
// Test auth functions
import { hashPassword, comparePasswords } from '@/lib/auth/session';

test('password hashing', async () => {
  const hash = await hashPassword('password123');
  const isValid = await comparePasswords('password123', hash);
  expect(isValid).toBe(true);
});
```

### Integration Testing
```typescript
// Test database operations
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

test('user creation', async () => {
  const [user] = await db.insert(users).values({
    email: 'test@example.com',
    passwordHash: 'hashed'
  }).returning();
  
  expect(user.email).toBe('test@example.com');
});
```

### Mock External Services
```typescript
// Mock Stripe
jest.mock('@/lib/payments/stripe', () => ({
  createCheckoutSession: jest.fn(),
  handleSubscriptionChange: jest.fn(),
}));
```

## 🔄 Development Workflow

### 1. Setup Development Environment
```bash
# Run setup script
node lib/db/setup.ts

# Seed database
node lib/db/seed.ts

# Start development server
npm run dev
```

### 2. Adding New Features
```typescript
// 1. Define database schema (if needed)
// lib/db/schema.ts
export const newTable = pgTable('new_table', { ... });

// 2. Create query functions
// lib/db/queries.ts
export async function getNewData() { ... }

// 3. Add server actions (if needed)
// lib/auth/middleware.ts
export const newAction = validatedAction(schema, handler);

// 4. Use in components
import { getNewData } from '@/lib/db/queries';
```

### 3. Database Changes
```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Reset database (development)
npm run db:reset
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `POSTGRES_URL` in `.env`
   - Verify database is running
   - Check network connectivity

2. **Authentication Failures**
   - Verify `AUTH_SECRET` is set
   - Check JWT token expiration
   - Ensure cookies are enabled

3. **Payment Issues**
   - Verify Stripe keys are correct
   - Check webhook endpoints
   - Ensure success URLs are valid

4. **Type Errors**
   - Run `npm run type-check`
   - Check import paths
   - Verify schema types

### Debug Tools
```typescript
// Enable query logging
const db = drizzle(client, { schema, logger: true });

// Debug authentication
console.log('Session:', await getSession());

// Test Stripe connection
const products = await stripe.products.list();
console.log('Stripe products:', products.data.length);
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team/)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [bcrypt Security](https://github.com/kelektiv/node.bcrypt.js)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

## 🎯 Best Practices

### Code Organization
- Keep business logic in library functions
- Use TypeScript for type safety
- Follow single responsibility principle
- Document complex functions

### Security
- Never expose secret keys
- Validate all inputs
- Use parameterized queries
- Implement proper error handling

### Performance
- Use connection pooling
- Implement caching where appropriate
- Optimize database queries
- Monitor external API calls

### Testing
- Write unit tests for utilities
- Test authentication flows
- Mock external services
- Test error scenarios












# Database Layer Documentation

This folder contains all database-related code for the SaaS application. It uses **Drizzle ORM** with **PostgreSQL** for type-safe database operations.

## 📁 File Structure

```
lib/db/
├── schema.ts          # Database table definitions and relationships
├── drizzle.ts         # Database connection setup
├── queries.ts         # Database query functions (Server Actions)
├── seed.ts           # Database seeding script
├── setup.ts          # Development environment setup
├── seed-no-stripe.ts # Alternative seeding without Stripe
├── migrations/        # Database migration files
│   ├── 0000_soft_the_anarchist.sql
│   └── meta/
└── README.md         # This documentation
```

## 🗄️ Database Schema

### Core Tables

1. **users** - User accounts and authentication
2. **teams** - Organizations/companies with subscription billing
3. **team_members** - Links users to teams with roles
4. **activity_logs** - User activity tracking
5. **invitations** - Team invitation system

### Key Relationships

- **Users ↔ Teams**: Many-to-many through `team_members`
- **Teams → Stripe**: Billing integration via Stripe IDs
- **Users → Activity**: One-to-many for activity logging

## 🔧 Key Files Explained

### `schema.ts` - Database Schema
- **Purpose**: Defines all database tables, columns, and relationships
- **Key Concepts**: 
  - `pgTable`: Creates PostgreSQL tables
  - `relations`: Defines foreign key relationships
  - Type inference for TypeScript safety
- **Usage**: Import table definitions in queries

### `drizzle.ts` - Database Connection
- **Purpose**: Establishes connection to PostgreSQL database
- **Key Concepts**:
  - Environment variables for configuration
  - Connection pooling for performance
  - Schema integration for type safety
- **Usage**: Import `db` for all database operations

### `queries.ts` - Database Operations
- **Purpose**: Contains all database query functions
- **Key Concepts**:
  - Server Actions (run on server, not browser)
  - Session management and authentication
  - Type-safe query building
- **Usage**: Import functions for data operations

### `seed.ts` - Database Seeding
- **Purpose**: Populates database with initial test data
- **Key Concepts**:
  - Password hashing for security
  - Stripe product/pricing creation
  - Test user and team setup
- **Usage**: Run once to set up development data

### `setup.ts` - Development Setup
- **Purpose**: Interactive script for environment configuration
- **Key Concepts**:
  - Stripe CLI integration
  - Docker database setup
  - Environment variable management
- **Usage**: Run once when setting up the project

## 🚀 Getting Started

### 1. Set Up Environment
```bash
# Run the setup script
npm run setup
# or
node lib/db/setup.ts
```

### 2. Seed Database
```bash
# Populate with test data
npm run seed
# or
node lib/db/seed.ts
```

### 3. Run Migrations
```bash
# Apply database schema changes
npm run db:migrate
```

## 💡 Common Patterns

### Querying Data
```typescript
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

// Get all users
const allUsers = await db.select().from(users);

// Get user by ID
const user = await db.select().from(users).where(eq(users.id, userId));
```

### Inserting Data
```typescript
// Insert new user
const [newUser] = await db.insert(users).values({
  email: 'user@example.com',
  passwordHash: hashedPassword,
  role: 'member'
}).returning();
```

### Updating Data
```typescript
// Update user
await db.update(users)
  .set({ name: 'New Name' })
  .where(eq(users.id, userId));
```

## 🔒 Security Best Practices

1. **Password Hashing**: Always hash passwords before storing
2. **Input Validation**: Validate all user inputs
3. **SQL Injection**: Use parameterized queries (Drizzle handles this)
4. **Environment Variables**: Store secrets in `.env` file
5. **Session Management**: Verify tokens and check expiration

## 🧪 Testing

### Test Database Setup
```typescript
// Use separate test database
const testDb = drizzle(testClient, { schema });
```

### Mocking Queries
```typescript
// Mock database functions for unit tests
jest.mock('@/lib/db/queries', () => ({
  getUser: jest.fn(),
  getTeamForUser: jest.fn(),
}));
```

## 🔄 Database Migrations

Migrations are stored in the `migrations/` folder and track database schema changes over time.

### Creating Migrations
```bash
# Generate migration from schema changes
npm run db:generate
```

### Applying Migrations
```bash
# Apply pending migrations
npm run db:migrate
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Errors**: Check `POSTGRES_URL` in `.env`
2. **Migration Failures**: Ensure database is accessible
3. **Stripe Errors**: Verify API keys and webhook setup
4. **Type Errors**: Run `npm run type-check`

### Debug Queries
```typescript
// Enable query logging
const db = drizzle(client, { 
  schema, 
  logger: true 
});
```


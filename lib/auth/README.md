# Authentication Layer Documentation

This folder contains all authentication and authorization functionality for the SaaS application. It provides secure user authentication, session management, and middleware for protecting routes and actions.

## 📁 File Structure

```
lib/auth/
├── session.ts     # Password hashing, JWT tokens, session management
├── middleware.ts  # Server action middleware with validation
└── README.md     # This documentation
```

## 🔐 Authentication System Overview

### Core Components

1. **Password Security** - bcrypt hashing with salt rounds
2. **JWT Tokens** - Secure session tokens with expiration
3. **Cookie Management** - HttpOnly, secure cookies for session storage
4. **Server Actions** - Type-safe form handling with validation
5. **Middleware** - Authentication guards and team context

## 🔧 Key Files Explained

### `session.ts` - Core Authentication
- **Purpose**: Handles password security, JWT tokens, and session management
- **Key Functions**:
  - `hashPassword()` - Securely hash passwords with bcrypt
  - `comparePasswords()` - Verify passwords without timing attacks
  - `signToken()` - Create signed JWT tokens
  - `verifyToken()` - Validate and decode JWT tokens
  - `setSession()` - Create secure user sessions
  - `getSession()` - Retrieve current user session

### `middleware.ts` - Server Action Middleware
- **Purpose**: Provides higher-order functions for secure server actions
- **Key Functions**:
  - `validatedAction()` - Form validation with Zod schemas
  - `validatedActionWithUser()` - Validation + authentication
  - `withTeam()` - Team context for multi-tenant actions

## 🛡️ Security Features

### Password Security
```typescript
// Passwords are hashed with bcrypt (industry standard)
const hashedPassword = await hashPassword('userPassword');
const isValid = await comparePasswords('userPassword', hashedPassword);
```

### Session Security
```typescript
// JWT tokens are signed and expire in 24 hours
const token = await signToken({ user: { id: 123 }, expires: '2024-01-01' });

// Cookies are secure and httpOnly
cookies.set('session', token, {
  httpOnly: true,    // Prevent XSS attacks
  secure: true,      // HTTPS only in production
  sameSite: 'lax',  // CSRF protection
});
```

### Input Validation
```typescript
// Automatic form validation with Zod
const createUserAction = validatedAction(
  z.object({
    email: z.string().email(),
    name: z.string().min(2),
  }),
  async (data) => {
    // data is validated and typed
    return await createUser(data);
  }
);
```

## 🚀 Usage Examples

### Basic Authentication
```typescript
import { hashPassword, comparePasswords, setSession } from '@/lib/auth/session';

// User registration
const passwordHash = await hashPassword(password);
const user = await createUser({ email, passwordHash });
await setSession(user);

// User login
const isValid = await comparePasswords(password, user.passwordHash);
if (isValid) {
  await setSession(user);
}
```

### Protected Server Actions
```typescript
import { validatedActionWithUser } from '@/lib/auth/middleware';

const updateProfileAction = validatedActionWithUser(
  z.object({ name: z.string().min(2) }),
  async (data, formData, user) => {
    // user is guaranteed to be authenticated
    return await updateUserProfile(user.id, data);
  }
);
```

### Team-Based Actions
```typescript
import { withTeam } from '@/lib/auth/middleware';

const inviteMemberAction = withTeam(async (formData, team) => {
  // team is guaranteed to exist and user is a member
  const email = formData.get('email') as string;
  return await inviteTeamMember(team.id, email);
});
```

## 🔒 Security Best Practices

### 1. Password Handling
- ✅ Always hash passwords with bcrypt
- ✅ Use secure comparison to prevent timing attacks
- ❌ Never store plain text passwords
- ❌ Never log passwords

### 2. Session Management
- ✅ Use httpOnly cookies to prevent XSS
- ✅ Set secure flag for HTTPS
- ✅ Use sameSite for CSRF protection
- ✅ Implement session expiration
- ❌ Don't store sensitive data in JWT payload

### 3. Input Validation
- ✅ Validate all user inputs with Zod
- ✅ Use type-safe schemas
- ✅ Sanitize data before database operations
- ❌ Never trust client-side validation alone

### 4. Authentication Checks
- ✅ Always verify user authentication
- ✅ Check user permissions for sensitive operations
- ✅ Redirect unauthenticated users
- ❌ Don't rely on client-side authentication state

## 🧪 Testing Authentication

### Mock Authentication
```typescript
// Mock user for testing
jest.mock('@/lib/auth/session', () => ({
  getUser: jest.fn().mockResolvedValue({
    id: 1,
    email: 'test@example.com',
    role: 'owner'
  }),
  setSession: jest.fn(),
}));
```

### Test Server Actions
```typescript
// Test protected actions
const result = await updateProfileAction(
  { error: null },
  new FormData([['name', 'New Name']])
);
expect(result.success).toBeDefined();
```

## 🔄 Authentication Flow

### 1. User Registration
```
User submits form → Validate input → Hash password → Create user → Set session → Redirect
```

### 2. User Login
```
User submits credentials → Verify password → Set session → Redirect to dashboard
```

### 3. Protected Route Access
```
Request → Check session → Verify token → Get user data → Allow access
```

### 4. Server Action Execution
```
Form submission → Validate input → Check authentication → Execute action → Return result
```

## 🐛 Common Issues

### Session Not Persisting
- Check cookie settings (httpOnly, secure, sameSite)
- Verify AUTH_SECRET environment variable
- Check token expiration

### Authentication Errors
- Verify user exists in database
- Check password hashing consistency
- Validate JWT token signature

### Permission Errors
- Ensure user has required role
- Check team membership
- Verify action permissions

## 📚 Additional Resources

- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Zod Validation](https://zod.dev/)


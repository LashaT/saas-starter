/**
 * AUTHENTICATION & SESSION MANAGEMENT
 * 
 * This file handles all authentication-related functionality including:
 * - Password hashing and verification
 * - JWT token creation and verification
 * - Session management with secure cookies
 * 
 * Key Concepts for Junior Developers:
 * - Password Hashing: Never store plain text passwords (use bcrypt)
 * - JWT Tokens: Secure way to store user session data
 * - Cookies: Store session tokens in browser securely
 * - Session Expiry: Tokens expire for security
 * 
 * Security Features:
 * - Passwords are hashed with bcrypt (industry standard)
 * - JWT tokens are signed with secret key
 * - Cookies are httpOnly (can't be accessed by JavaScript)
 * - Cookies are secure (HTTPS only in production)
 * - Sessions expire after 1 day
 */

import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';

// JWT signing key (must be kept secret)
const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10; // Higher = more secure but slower

/**
 * Hash a password for secure storage
 * 
 * @param password - Plain text password
 * @returns Hashed password string
 * 
 * Security: Uses bcrypt with salt rounds for protection against rainbow tables
 */
export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * 
 * @param plainTextPassword - Password from login form
 * @param hashedPassword - Stored password hash from database
 * @returns Promise<boolean> - True if passwords match
 * 
 * Security: Uses bcrypt's secure comparison to prevent timing attacks
 */
export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

/**
 * Session data structure stored in JWT token
 */
type SessionData = {
  user: { id: number };  // User ID for database lookups
  expires: string;       // ISO timestamp when token expires
};

/**
 * Create a signed JWT token for user session
 * 
 * @param payload - Session data to encode
 * @returns Signed JWT token string
 * 
 * Security: Token is signed with secret key and expires in 1 day
 */
export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })  // HMAC SHA-256 algorithm
    .setIssuedAt()                         // When token was created
    .setExpirationTime('1 day from now')   // Token expires in 24 hours
    .sign(key);                            // Sign with secret key
}

/**
 * Verify and decode a JWT token
 * 
 * @param input - JWT token string from cookie
 * @returns Decoded session data
 * 
 * Security: Verifies token signature and expiration
 */
export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],  // Only accept HMAC SHA-256
  });
  return payload as SessionData;
}

/**
 * Get current user session from cookie
 * 
 * @returns Session data or null if no valid session
 * 
 * Usage: Check if user is logged in
 */
export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

/**
 * Create and set a new user session
 * 
 * @param user - User data from database
 * 
 * Security Features:
 * - httpOnly: Cookie can't be accessed by JavaScript (XSS protection)
 * - secure: Only sent over HTTPS in production
 * - sameSite: 'lax' prevents CSRF attacks
 * - expires: Cookie expires in 24 hours
 */
export async function setSession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,    // Prevent XSS attacks
    secure: true,      // HTTPS only in production
    sameSite: 'lax',   // CSRF protection
  });
}

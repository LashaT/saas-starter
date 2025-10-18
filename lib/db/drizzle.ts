/**
 * DATABASE CONNECTION SETUP
 * 
 * This file establishes the connection to the PostgreSQL database using Drizzle ORM.
 * It's the central point for all database operations in the application.
 * 
 * Key Concepts for Junior Developers:
 * - postgres: Lightweight PostgreSQL client for Node.js
 * - drizzle: Type-safe ORM that provides database query builder
 * - dotenv: Loads environment variables from .env file
 * - process.env: Access to environment variables
 * 
 * Usage:
 * Import this file anywhere you need to run database queries:
 * import { db } from '@/lib/db/drizzle';
 * 
 * Then use: db.select().from(users).where(...)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Create PostgreSQL client connection
export const client = postgres(process.env.POSTGRES_URL);

// Create Drizzle database instance with schema
export const db = drizzle(client, { schema });

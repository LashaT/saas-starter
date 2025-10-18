/**
 * DATABASE SEEDING SCRIPT
 * 
 * This file populates the database with initial data for development and testing.
 * It creates sample users, teams, and Stripe products/prices.
 * 
 * Key Concepts for Junior Developers:
 * - Seeding: Adding initial data to an empty database
 * - Stripe Integration: Creating products and pricing in Stripe
 * - Password Hashing: Never store plain text passwords
 * - Database Transactions: All operations should succeed or fail together
 * 
 * What this script does:
 * 1. Creates a test user with hashed password
 * 2. Creates a test team
 * 3. Links the user to the team as owner
 * 4. Creates Stripe products and prices for subscription plans
 * 
 * Usage: Run this script to set up initial data for development
 */

import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';

/**
 * Creates subscription products and prices in Stripe
 * 
 * This function sets up the billing structure for the SaaS application:
 * - Base Plan: $8/month with 7-day trial
 * - Plus Plan: $12/month with 7-day trial
 * 
 * Important Notes:
 * - Prices are in cents (800 = $8.00)
 * - All prices are recurring monthly subscriptions
 * - Each plan includes a 7-day free trial
 * - These products will be used for customer subscriptions
 */
async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  // Create Base subscription product
  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  // Create Base pricing ($8/month)
  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  // Create Plus subscription product
  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  // Create Plus pricing ($12/month)
  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

/**
 * Main seeding function that populates the database with initial data
 * 
 * This function:
 * 1. Creates a test user account (test@test.com / admin123)
 * 2. Creates a test team
 * 3. Links the user to the team as owner
 * 4. Sets up Stripe products and pricing
 * 
 * Security Note: The test password is hashed before storage
 */
async function seed() {
  // Test user credentials
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  // Create test user in database
  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  // Create test team
  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  // Link user to team as owner
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  // Set up Stripe billing products
  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });

/**
 * STRIPE PAYMENT SERVER ACTIONS
 * 
 * This file contains server actions for handling Stripe payments:
 * - Checkout session creation for new subscriptions
 * - Customer portal access for subscription management
 * 
 * Key Concepts for Junior Developers:
 * - Server Actions: Secure server-side functions for form handling
 * - Stripe Checkout: Hosted payment forms for security
 * - Customer Portal: Self-service subscription management
 * - Team Context: Actions that require team membership
 * 
 * Security Features:
 * - Server-side payment processing
 * - Team-based access control
 * - Secure redirects to Stripe
 */

'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

/**
 * Create a Stripe checkout session for subscription purchase
 * 
 * @param formData - Form data containing priceId
 * @param team - Team context (guaranteed by withTeam middleware)
 * 
 * Usage:
 * ```tsx
 * <form action={checkoutAction}>
 *   <input type="hidden" name="priceId" value="price_123" />
 *   <button type="submit">Subscribe to Pro Plan</button>
 * </form>
 * ```
 * 
 * Flow:
 * 1. User clicks subscribe button
 * 2. Server creates Stripe checkout session
 * 3. User is redirected to Stripe's secure payment form
 * 4. After payment, user returns to success page
 */
export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ team: team, priceId });
});

/**
 * Access Stripe customer portal for subscription management
 * 
 * @param formData - Form data (not used)
 * @param team - Team context (guaranteed by withTeam middleware)
 * 
 * Features available in portal:
 * - Update subscription plan
 * - Cancel subscription
 * - Update payment method
 * - View billing history
 * - Download invoices
 * 
 * Usage:
 * ```tsx
 * <form action={customerPortalAction}>
 *   <button type="submit">Manage Subscription</button>
 * </form>
 * ```
 */
export const customerPortalAction = withTeam(async (_, team) => {
  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});

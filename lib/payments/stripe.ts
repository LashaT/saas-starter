/**
 * STRIPE PAYMENT INTEGRATION
 * 
 * This file handles all Stripe payment operations including:
 * - Checkout session creation for subscriptions
 * - Customer portal for subscription management
 * - Webhook handling for payment events
 * - Product and pricing management
 * 
 * Key Concepts for Junior Developers:
 * - Stripe Checkout: Secure payment forms hosted by Stripe
 * - Customer Portal: Self-service subscription management
 * - Webhooks: Real-time notifications from Stripe
 * - Subscription Lifecycle: Trial → Active → Canceled states
 * - Customer Management: Linking Stripe customers to database users
 * 
 * Security Features:
 * - Server-side payment processing (never expose secret keys)
 * - Webhook signature verification
 * - Secure redirect URLs
 * - Customer data protection
 */

import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import {
  getTeamByStripeCustomerId,
  getUser,
  updateTeamSubscription
} from '@/lib/db/queries';

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'  // Use latest API version
});

/**
 * Create a Stripe Checkout session for subscription purchase
 * 
 * @param team - Team data (may be null for new customers)
 * @param priceId - Stripe price ID for the subscription plan
 * 
 * Flow:
 * 1. Check if user and team exist
 * 2. Create Stripe checkout session
 * 3. Redirect user to Stripe's secure payment form
 * 4. User completes payment on Stripe's servers
 * 5. Stripe redirects back to success URL
 * 
 * Security: All payment processing happens on Stripe's servers
 */
export async function createCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  const user = await getUser();

  // Redirect to sign-up if user not authenticated or no team
  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],  // Accept credit/debit cards
    line_items: [
      {
        price: priceId,    // Which subscription plan
        quantity: 1        // How many subscriptions
      }
    ],
    mode: 'subscription',  // Recurring payment
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer: team.stripeCustomerId || undefined,  // Link to existing customer
    client_reference_id: user.id.toString(),       // Track which user
    allow_promotion_codes: true,                    // Allow discount codes
    subscription_data: {
      trial_period_days: 14  // 14-day free trial
    }
  });

  // Redirect to Stripe's secure payment form
  redirect(session.url!);
}

/**
 * Create a Stripe Customer Portal session for subscription management
 * 
 * @param team - Team with Stripe customer ID
 * @returns Stripe billing portal session
 * 
 * Features:
 * - Update subscription plan
 * - Cancel subscription
 * - Update payment method
 * - View billing history
 * - Download invoices
 * 
 * Security: Only allows access to the team's own subscription data
 */
export async function createCustomerPortalSession(team: Team) {
  // Redirect to pricing if no Stripe customer exists
  if (!team.stripeCustomerId || !team.stripeProductId) {
    redirect('/pricing');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  // Use existing configuration or create new one
  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    // Get product details
    const product = await stripe.products.retrieve(team.stripeProductId);
    if (!product.active) {
      throw new Error("Team's product is not active in Stripe");
    }

    // Get available prices for the product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the team's product");
    }

    // Create billing portal configuration
    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id)
            }
          ]
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        payment_method_update: {
          enabled: true
        }
      }
    });
  }

  // Create portal session
  return stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
    configuration: configuration.id
  });
}

/**
 * Handle subscription changes from Stripe webhooks
 * 
 * @param subscription - Stripe subscription object from webhook
 * 
 * This function is called when Stripe sends webhook events about subscription changes:
 * - Payment succeeded/failed
 * - Subscription activated/canceled
 * - Plan changes
 * - Trial periods
 * 
 * Webhook Events Handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // Find team by Stripe customer ID
  const team = await getTeamByStripeCustomerId(customerId);

  if (!team) {
    console.error('Team not found for Stripe customer:', customerId);
    return;
  }

  // Handle active/trialing subscriptions
  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: (plan?.product as Stripe.Product).name,
      subscriptionStatus: status
    });
  } 
  // Handle canceled/unpaid subscriptions
  else if (status === 'canceled' || status === 'unpaid') {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status
    });
  }
}

/**
 * Get all active Stripe prices for pricing page
 * 
 * @returns Array of price objects with product details
 * 
 * Used for:
 * - Displaying pricing plans on pricing page
 * - Showing trial periods and billing intervals
 * - Creating checkout sessions
 */
export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],  // Include product details
    active: true,              // Only active prices
    type: 'recurring'          // Only subscription prices
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days
  }));
}

/**
 * Get all active Stripe products for display
 * 
 * @returns Array of product objects with pricing info
 * 
 * Used for:
 * - Product catalog display
 * - Feature comparison
 * - Plan selection UI
 */
export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price']  // Include default pricing
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}

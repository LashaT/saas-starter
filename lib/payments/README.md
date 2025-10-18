# Payments Layer Documentation

This folder contains all Stripe payment integration functionality for the SaaS application. It handles subscription billing, payment processing, and customer management through Stripe's secure APIs.

## 📁 File Structure

```
lib/payments/
├── stripe.ts     # Core Stripe API integration
├── actions.ts    # Server actions for payment forms
└── README.md    # This documentation
```

## 💳 Payment System Overview

### Core Components

1. **Stripe Checkout** - Secure hosted payment forms
2. **Customer Portal** - Self-service subscription management
3. **Webhook Handling** - Real-time payment event processing
4. **Product Management** - Dynamic pricing and plans
5. **Subscription Lifecycle** - Trial → Active → Canceled states

## 🔧 Key Files Explained

### `stripe.ts` - Core Stripe Integration
- **Purpose**: Direct Stripe API integration and business logic
- **Key Functions**:
  - `createCheckoutSession()` - Start subscription purchase flow
  - `createCustomerPortalSession()` - Access subscription management
  - `handleSubscriptionChange()` - Process webhook events
  - `getStripePrices()` - Fetch pricing for display
  - `getStripeProducts()` - Get product catalog

### `actions.ts` - Server Actions
- **Purpose**: Secure server-side functions for payment forms
- **Key Functions**:
  - `checkoutAction` - Start checkout process
  - `customerPortalAction` - Access customer portal

## 🚀 Payment Flow

### 1. Subscription Purchase
```
User clicks "Subscribe" → Server creates checkout session → 
Redirect to Stripe → User completes payment → 
Webhook updates database → User returns to app
```

### 2. Subscription Management
```
User clicks "Manage Subscription" → Server creates portal session → 
Redirect to Stripe portal → User updates/cancels → 
Webhook updates database → User returns to app
```

### 3. Webhook Processing
```
Stripe sends webhook → Server verifies signature → 
Process subscription change → Update database → 
Send confirmation (optional)
```

## 💡 Usage Examples

### Creating a Checkout Session
```typescript
import { createCheckoutSession } from '@/lib/payments/stripe';

// Start subscription purchase
await createCheckoutSession({
  team: userTeam,
  priceId: 'price_1234567890'
});
```

### Using Payment Actions in Forms
```tsx
import { checkoutAction, customerPortalAction } from '@/lib/payments/actions';

// Subscribe to plan
<form action={checkoutAction}>
  <input type="hidden" name="priceId" value="price_123" />
  <button type="submit">Subscribe to Pro</button>
</form>

// Manage subscription
<form action={customerPortalAction}>
  <button type="submit">Manage Billing</button>
</form>
```

### Handling Webhooks
```typescript
import { handleSubscriptionChange } from '@/lib/payments/stripe';

// In webhook handler
if (event.type === 'customer.subscription.updated') {
  await handleSubscriptionChange(event.data.object);
}
```

## 🔒 Security Features

### Server-Side Processing
- All payment operations happen on the server
- Secret keys never exposed to client
- Secure redirect URLs
- Webhook signature verification

### Data Protection
- Customer data encrypted by Stripe
- PCI compliance handled by Stripe
- Secure token-based authentication
- HTTPS-only communication

### Access Control
- Team-based subscription management
- User authentication required
- Role-based permissions
- Audit logging for all changes

## 🧪 Testing Payments

### Test Mode Setup
```typescript
// Use Stripe test keys
const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!);

// Test card numbers
const testCards = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient: '4000000000009995'
};
```

### Mock Webhooks
```typescript
// Test subscription events
const mockSubscription = {
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  items: { data: [{ plan: { product: 'prod_test123' } }] }
};

await handleSubscriptionChange(mockSubscription);
```

## 🔄 Subscription States

### Active States
- `trialing` - Free trial period
- `active` - Paid and current
- `past_due` - Payment failed, retrying

### Inactive States
- `canceled` - Subscription ended
- `unpaid` - Payment failed, no retry
- `incomplete` - Setup not completed

### State Transitions
```
trial → active (trial ends, payment succeeds)
active → past_due (payment fails)
past_due → active (payment retry succeeds)
active → canceled (user cancels)
```

## 🐛 Common Issues

### Checkout Not Working
- Verify Stripe keys are correct
- Check webhook endpoints are accessible
- Ensure success/cancel URLs are valid
- Verify price IDs exist in Stripe

### Portal Access Denied
- Check customer has active subscription
- Verify Stripe customer ID exists
- Ensure billing portal is configured
- Check user has team access

### Webhook Failures
- Verify webhook secret is correct
- Check endpoint is accessible
- Ensure proper event handling
- Monitor webhook delivery logs

## 📊 Monitoring & Analytics

### Key Metrics to Track
- Conversion rate (trial → paid)
- Churn rate (cancellations)
- Revenue per customer
- Payment failure rates
- Subscription upgrades/downgrades

### Stripe Dashboard
- Real-time payment monitoring
- Customer analytics
- Revenue reporting
- Failed payment alerts

## 🔧 Configuration

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_...     # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...   # Webhook signature secret
BASE_URL=https://yourapp.com      # App URL for redirects
```

### Webhook Events to Listen For
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Customer Portal Setup](https://stripe.com/docs/billing/subscriptions/customer-portal)


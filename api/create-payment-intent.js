import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        categoryId: metadata.categoryId,
        userId: metadata.userId,
        categoryName: metadata.categoryName,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      },
      description: `Unlock ${metadata.categoryName} category for user ${metadata.userId}`
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(error.statusCode || 500).json({
      error: error.message,
      type: error.type,
      code: error.code
    });
  }
}

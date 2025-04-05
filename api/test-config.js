export default async function handler(req, res) {
  const config = {
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    firebaseConfigured: !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ),
    stripeKeyType: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'test' : 'live'
  };

  res.status(200).json({
    success: true,
    message: 'Configuration status',
    config,
    missingVariables: [
      !process.env.STRIPE_SECRET_KEY && 'STRIPE_SECRET_KEY',
      !process.env.STRIPE_WEBHOOK_SECRET && 'STRIPE_WEBHOOK_SECRET',
      !process.env.FIREBASE_PROJECT_ID && 'FIREBASE_PROJECT_ID',
      !process.env.FIREBASE_CLIENT_EMAIL && 'FIREBASE_CLIENT_EMAIL',
      !process.env.FIREBASE_PRIVATE_KEY && 'FIREBASE_PRIVATE_KEY'
    ].filter(Boolean)
  });
}

import Stripe from 'stripe';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payments
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    try {
      // Update the user's unlocked categories in Firestore
      const { userId, categoryId } = paymentIntent.metadata;
      
      await db.collection('users').doc(userId).update({
        unlockedCategories: admin.firestore.FieldValue.arrayUnion(categoryId),
        [`categoryData.${categoryId}`]: {
          unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentIntentId: paymentIntent.id,
        },
      });
      
      console.log(`Successfully unlocked category ${categoryId} for user ${userId}`);
    } catch (error) {
      console.error('Error updating user data:', error);
      // Still return 200 to Stripe but log the error
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  res.status(200).json({ received: true });
}

import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

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
    return res.status(400).json({
      error: 'Webhook signature verification failed',
      message: err.message
    });
  }

  try {
    // Handle the event based on its type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true, type: event.type });
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: err.message
    });
  }
}

async function handlePaymentSuccess(paymentIntent) {
  const { userId, categoryId, categoryName } = paymentIntent.metadata;
  
  if (!userId || !categoryId) {
    throw new Error('Missing required metadata: userId or categoryId');
  }

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error(`User document not found for ID: ${userId}`);
  }

  // Update user's unlocked categories
  await userRef.update({
    unlockedCategories: admin.firestore.FieldValue.arrayUnion(categoryId),
    [`categoryData.${categoryId}`]: {
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      categoryName,
      status: 'succeeded'
    },
  });

  // Log the successful payment
  await db.collection('payments').doc(paymentIntent.id).set({
    userId,
    categoryId,
    categoryName,
    amount: paymentIntent.amount,
    status: 'succeeded',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    paymentMethod: paymentIntent.payment_method,
    metadata: paymentIntent.metadata
  });
}

async function handlePaymentFailure(paymentIntent) {
  const { userId, categoryId, categoryName } = paymentIntent.metadata;
  
  if (!userId || !categoryId) {
    throw new Error('Missing required metadata: userId or categoryId');
  }

  // Log the failed payment
  await db.collection('payments').doc(paymentIntent.id).set({
    userId,
    categoryId,
    categoryName,
    amount: paymentIntent.amount,
    status: 'failed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    error: paymentIntent.last_payment_error?.message,
    metadata: paymentIntent.metadata
  });
}


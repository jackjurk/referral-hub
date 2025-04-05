import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ category, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (submitError) {
        setError(submitError.message);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay ${category.price}`}
      </button>
    </form>
  );
}

export default function PaymentModal({ isOpen, onClose, category, onSuccess }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (isOpen && category) {
      // Create a payment intent when the modal opens
      fetch('http://localhost:3001/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(category.price.replace('$', '')),
          currency: 'usd'
        })
      })
        .then(res => res.json())
        .then(data => setClientSecret(data.clientSecret))
        .catch(err => console.error('Error creating payment intent:', err));
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Unlock {category.name}</h2>
            <p className="text-gray-600 text-sm mt-1">One-time payment of {category.price}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-medium"
          >
            ×
          </button>
        </div>

        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#3B82F6',
                  colorBackground: '#ffffff',
                  colorText: '#1F2937',
                  colorDanger: '#EF4444',
                  fontFamily: 'system-ui, sans-serif',
                  spacingUnit: '6px',
                  borderRadius: '8px',
                }
              }
            }}
          >
            <CheckoutForm
              category={category}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}

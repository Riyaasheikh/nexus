import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

// ✅ Must match AuthContext.tsx exactly — this was the root cause of the 401 error
const TOKEN_KEY = 'business_nexus_token';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API_BASE = import.meta.env.VITE_API_BASE_URL ||'http://127.0.0.1:8000';

// ✅ Helper used in every axios call inside this file
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
});

interface DepositFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const DepositForm: React.FC<DepositFormProps> = ({ onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Ask backend to create a Stripe PaymentIntent
      const { data } = await axios.post(
        `${API_BASE}/api/payments/create-intent`,
        { amount },
        { headers: authHeaders() }  // ✅ correct token key
      );

      // Step 2: Confirm the card with Stripe directly
      const result = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (result.error) {
        // Stripe declined the card — show the real Stripe error message
        setError(result.error.message || 'Payment failed.');
      } else if (result.paymentIntent?.status === 'succeeded') {
        // Step 3: Tell backend to record the confirmed transaction
        await axios.post(
          `${API_BASE}/api/payments/deposit`,
          {
            amount,
            payment_intent_id: result.paymentIntent.id
          },
          { headers: authHeaders() }  // ✅ correct token key
        );
        onSuccess();  // refreshes transaction list in PaymentsPage
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount Field */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Amount (USD)
        </label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="e.g. 500"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:border-indigo-400 outline-none transition-colors"
        />
      </div>

      {/* Stripe Card Field */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Card Details
        </label>
        <div className="border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-indigo-400 transition-colors bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': { color: '#9ca3af' },
                }
              }
            }}
          />
        </div>
        {/* Reminder for test card during development */}
        <p className="text-xs text-gray-400 mt-1.5">
          🧪 Test card: <span className="font-mono">4242 4242 4242 4242</span> · Any future date · Any CVC
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
      >
        {loading ? 'Processing...' : `Deposit $${amount || '0'}`}
      </Button>
    </form>
  );
};

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Funds</h2>
        <p className="text-sm text-gray-500 mb-6">
          Securely add funds to your Nexus Wallet via Stripe
        </p>

        {/* Elements wraps the form to provide Stripe context */}
        <Elements stripe={stripePromise}>
          <DepositForm onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
};

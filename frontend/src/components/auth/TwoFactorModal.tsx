import React, { useState } from 'react';
import { ShieldCheck, Mail, KeyRound, Loader2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void; // called when OTP is confirmed — proceed with login
  email: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  email,
}) => {
  const [step, setStep]       = useState<'send' | 'verify'>('send');
  const [otp, setOtp]         = useState('');
  const [mockOtp, setMockOtp] = useState<string | null>(null); // shown in mock mode
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step 1 — Request OTP
  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${API_BASE}/auth/send-otp`, { email });

      // Mock mode: backend returns the OTP so we can display it for testing
      if (res.data.otp) {
        setMockOtp(res.data.otp);
      }

      setSuccess('OTP sent! Check the code below (mock mode).');
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE}/api/auth/verify-otp`, { email, otp });
      onVerified(); // tell parent component OTP passed
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 6 characters
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-indigo-100 rounded-2xl">
            <ShieldCheck size={36} className="text-indigo-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {step === 'send'
            ? `We'll send a 6-digit code to ${email}`
            : 'Enter the 6-digit code to continue'}
        </p>

        {/* Mock OTP Display — remove in production */}
        {mockOtp && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">
              🧪 Mock Mode — Your OTP
            </p>
            <p className="text-3xl font-black text-amber-700 tracking-widest">{mockOtp}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 font-medium">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 font-medium">
            {success}
          </div>
        )}

        {/* Step 1: Send OTP */}
        {step === 'send' && (
          <Button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full h-12 font-bold"
            leftIcon={loading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
          >
            {loading ? 'Sending...' : 'Send OTP Code'}
          </Button>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleOtpInput}
                placeholder="000000"
                className="w-full text-center text-3xl font-black tracking-[0.5em] border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-400 outline-none transition-colors"
              />
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full h-12 font-bold"
              leftIcon={loading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            {/* Resend option */}
            <button
              onClick={() => { setStep('send'); setOtp(''); setMockOtp(null); setError(null); }}
              className="w-full text-sm text-indigo-600 hover:underline text-center"
            >
              Resend OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

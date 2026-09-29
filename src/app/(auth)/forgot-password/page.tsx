'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GhostLogo } from '@/components/ui/GhostLogo';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6 font-mono">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block mb-2">
          <div className="w-12 h-12 rounded-2xl bg-surface border border-card-border flex items-center justify-center mx-auto shadow-md">
            <GhostLogo size={24} />
          </div>
        </Link>
        <h1 className="text-2xl font-black text-primary tracking-tight">
          Reset Your Password
        </h1>
        <p className="text-xs text-secondary">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      <div className="card-enchant p-6 sm:p-8 space-y-4 shadow-2xl">
        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-primary">Check Your Inbox</h3>
            <p className="text-xs text-secondary leading-relaxed">
              If an account exists for <span className="text-primary font-semibold">{email}</span>, a secure password reset link has been dispatched.
            </p>
            <Link
              href="/login"
              className="inline-block text-xs font-semibold text-accent hover:text-primary pt-3"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-secondary mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@ghostalts.com"
                required
                className="w-full bg-soft border border-card-border focus:border-accent text-xs text-primary placeholder:text-secondary/50 rounded-xl px-4 py-3 focus:outline-none transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-peri-500 hover:bg-peri-600 text-white font-semibold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(115,123,234,0.35)] active:scale-95 uppercase tracking-wide font-mono"
            >
              Send Reset Link
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-secondary font-mono">
        Remember your password?{' '}
        <Link href="/login" className="text-accent hover:text-primary font-semibold">
          Sign In
        </Link>
      </div>
    </div>
  );
}

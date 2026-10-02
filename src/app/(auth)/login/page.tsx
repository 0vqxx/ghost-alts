'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GhostLogo } from '@/components/ui/GhostLogo';
import { AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const urlError = searchParams.get('error');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || '');

  const handleDiscordSignIn = () => {
    setError('');
    setLoading(true);
    window.location.href = `/api/auth/discord?next=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6 font-mono">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block mb-2">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-card-border flex items-center justify-center mx-auto shadow-md hover:border-purple-500 transition-all hover:scale-105">
            <GhostLogo size={28} />
          </div>
        </Link>
        <h1 className="text-2xl font-black text-primary tracking-tight">
          Sign in to Ghost Alts
        </h1>
        <p className="text-xs text-secondary font-sans">
          Authentication is powered by Discord for automated order delivery and instant access.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Discord Sign-In Box */}
      <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden text-primary">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-card-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5865F2] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Discord Single Sign-On
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Verified
            </span>
          </div>

          <p className="text-xs text-secondary leading-relaxed font-sans">
            Connect your Discord account to view purchased credentials, receive automatic Discord DM delivery, and access the administration vault.
          </p>
        </div>

        {/* Discord Button */}
        <button
          type="button"
          onClick={handleDiscordSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white text-sm font-bold font-mono rounded-2xl transition-all shadow-md shadow-[#5865F2]/25 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2.5">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting to Discord...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Continue with Discord</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </>
          )}
        </button>

        <div className="pt-2 border-t border-card-border flex items-center justify-between text-[11px] text-secondary">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Direct Discord OAuth 2.0
          </span>
          <span>v2/auth</span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-xs text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 font-mono"
        >
          ← Back to Catalog
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs font-mono text-secondary">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

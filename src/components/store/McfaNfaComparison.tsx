import React from 'react';
import Link from 'next/link';
import { Check, X as XIcon, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export function McfaNfaComparison({ className = '' }: { className?: string }) {
  return (
    <section className={`py-8 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-card-border bg-surface text-secondary text-xs font-mono font-semibold">
            <span>TRANSPARENT ACCOUNT TIERS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight font-mono">
            MCFA vs NFA Breakdown
          </h2>
          <p className="text-xs sm:text-sm text-secondary font-mono">
            Know exactly what you are purchasing with zero hidden surprises.
          </p>
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
          {/* MCFA Card */}
          <div className="bg-surface border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Full Access (MCFA)
                </span>
                <span className="text-xs text-secondary font-semibold">From $18.99</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-primary">Complete Personal Ownership</h3>
                <p className="text-xs text-secondary mt-1 leading-relaxed">
                  You receive the Minecraft credentials plus direct login to the account&apos;s email mailbox.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-primary/80 pt-2 border-t border-card-border">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full Mailbox Access (Outlook / Mail.ru)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Change Email & Password to your own</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Customize IGN Username & Skin</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unbanned on Hypixel & Major Networks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Two-Factor Authentication (2FA) Support</span>
                </li>
              </ul>
            </div>

            <Link
              href="/store"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-center"
            >
              Browse MCFA Accounts
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* NFA Card */}
          <div className="bg-surface border border-card-border rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-soft border border-card-border text-secondary text-xs font-bold uppercase tracking-wider">
                  Non-Full Access (NFA)
                </span>
                <span className="text-xs text-secondary font-semibold">From $4.49</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-primary">Budget Casual Play</h3>
                <p className="text-xs text-secondary mt-1 leading-relaxed">
                  Budget launcher access for casual gameplay and server testing.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-primary/80 pt-2 border-t border-card-border">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Playable in Official Minecraft Launcher</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant Automated Delivery</span>
                </li>
                <li className="flex items-center gap-2.5 text-secondary/60">
                  <XIcon className="w-4 h-4 text-secondary/50 shrink-0" />
                  <span>No Email Mailbox Access</span>
                </li>
                <li className="flex items-center gap-2.5 text-secondary/60">
                  <XIcon className="w-4 h-4 text-secondary/50 shrink-0" />
                  <span>Email & Password Cannot Be Changed</span>
                </li>
                <li className="flex items-center gap-2.5 text-secondary/60">
                  <XIcon className="w-4 h-4 text-secondary/50 shrink-0" />
                  <span>Pre-existing In-Game Username</span>
                </li>
              </ul>
            </div>

            <Link
              href="/store"
              className="w-full py-3 px-4 bg-soft hover:bg-white/10 text-primary font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 text-center border border-card-border"
            >
              Browse NFA Accounts
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

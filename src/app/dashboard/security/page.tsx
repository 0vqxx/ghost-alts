import React from 'react';
import { requireUser } from '@/lib/auth';
import { ShieldCheck, Lock, Key, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardSecurityPage() {
  const user = await requireUser();

  return (
    <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm font-mono text-primary">
      <div className="pb-6 border-b border-card-border">
        <h2 className="text-xl font-bold text-primary">Security & Sessions</h2>
        <p className="text-xs text-secondary mt-0.5">
          Review active protection measures and credential defense settings.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Digital Delivery Shield</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed font-sans">
            All account credentials are encrypted and stored in memory or at-rest with zero client-side caching. Sensitive delivery details require explicit confirmation to decrypt.
          </p>
        </div>

        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <Key className="w-4 h-4 text-purple-400" />
            <span>Cryptographic Session Tokens</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed font-sans">
            Your login session is guarded with HTTP-only, SameSite secure cookies and audited against rate limit abuse.
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-2 text-xs">
          <p className="font-bold text-emerald-400">Security Recommendation for MCFA Accounts</p>
          <p className="text-emerald-300/80 leading-relaxed font-sans">
            Whenever you receive a Minecraft Full Access account, remember to immediately navigate to account.microsoft.com to change the security baseline, add your own mobile or email recovery method, and configure two-factor authentication.
          </p>
        </div>
      </div>
    </div>
  );
}

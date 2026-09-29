'use client';

import React from 'react';
import { ProductItem } from '@/lib/types';
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Globe,
  Zap,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

interface BeforeYouBuyProps {
  product: ProductItem;
}

export function BeforeYouBuy({ product }: BeforeYouBuyProps) {
  const isMCFA = product.type === 'MCFA';

  return (
    <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex items-start gap-3.5 pb-5 border-b border-card-border">
        <div className="w-10 h-10 rounded-xl bg-soft border border-card-border flex items-center justify-center text-primary shrink-0">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2 font-mono">
            Before You Buy — Account Disclosures & Transparency
          </h3>
          <p className="text-xs text-secondary mt-0.5 font-sans">
            Ghost Alts practices strict transparency. Review what is included and excluded for this specific account listing before completing checkout.
          </p>
        </div>
      </div>

      {/* Grid of Included vs Not Included */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        {/* Included List */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>What You Receive</span>
          </div>
          <ul className="space-y-2 text-xs text-primary/80 font-sans">
            {product.includedFeatures.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                <span className="text-primary font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Excluded List */}
        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
            <XCircle className="w-4 h-4 text-secondary" />
            <span>Limitations & Exclusions</span>
          </div>
          <ul className="space-y-2 text-xs text-secondary font-sans">
            {product.excludedFeatures.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-secondary/60 mt-0.5 font-bold">×</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Policy and Operational Requirements Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 font-mono">
        <div className="bg-soft border border-card-border rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Globe className="w-3.5 h-3.5 text-secondary" />
            <span>Region Policy</span>
          </div>
          <p className="text-[11px] text-secondary font-sans">
            {product.region} license. No VPN or proxy required. Official Microsoft authentication.
          </p>
        </div>

        <div className="bg-soft border border-card-border rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivery Method</span>
          </div>
          <p className="text-[11px] text-secondary font-sans">
            Instant digital delivery directly into your customer dashboard order history.
          </p>
        </div>

        <div className="bg-soft border border-card-border rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <RefreshCw className="w-3.5 h-3.5 text-secondary" />
            <span>Replacement Guarantee</span>
          </div>
          <p className="text-[11px] text-secondary font-sans">
            Guaranteed active upon delivery. Rapid replacement if invalid credentials are delivered.
          </p>
        </div>

        <div className="bg-soft border border-card-border rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <UserCheck className="w-3.5 h-3.5 text-secondary" />
            <span>Buyer Responsibilities</span>
          </div>
          <p className="text-[11px] text-secondary font-sans">
            {isMCFA
              ? 'Buyer must promptly change credentials and bind personal recovery 2FA.'
              : 'Buyer must not alter credentials on NFA accounts as stated in listing.'}
          </p>
        </div>
      </div>
    </div>
  );
}

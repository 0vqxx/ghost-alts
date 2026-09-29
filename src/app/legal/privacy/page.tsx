import React from 'react';

export const metadata = {
  title: 'Privacy Policy — Ghost Alts',
  description: 'Ghost Alts marketplace privacy policy and data protection standards.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">1. Information We Collect</h2>
          <p>
            We collect the minimum information necessary to execute digital transactions: email address for order notifications, username for dashboard identification, and payment tokens handled via PCI-compliant processors (Stripe). We never store raw credit card numbers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">2. Digital Delivery Vault Protection</h2>
          <p>
            Sensitive digital account credentials are encrypted and stored in private vaults accessible strictly by the verified purchaser. We enforce no-cache security headers and rate limits to block automated extraction.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">3. Third-Party Analytics & Security</h2>
          <p>
            Ghost Alts strictly forbids transmitting passwords, tokens, or credentials to third-party advertising or analytics networks.
          </p>
        </section>
      </div>
    </div>
  );
}

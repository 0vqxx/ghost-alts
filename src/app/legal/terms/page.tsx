import React from 'react';

export const metadata = {
  title: 'Terms of Service — Ghost Alts',
  description: 'Ghost Alts marketplace terms of service and user agreements.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">1. Acceptance of Terms</h2>
          <p>
            By accessing Ghost Alts (&ldquo;Service&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), placing orders, or utilizing digital delivery vaults, you agree to be bound by these Terms of Service. If you do not agree with any portion, do not proceed with purchasing digital goods on this marketplace.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">2. Digital Products & Classification</h2>
          <p>
            Ghost Alts provides digital access licenses classified into MCFA (Minecraft Full Access) and NFA (Non-Full Access). Each listing transparently describes the exact features, recovery terms, and limitations. The buyer agrees to inspect product specifications prior to completing checkout.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">3. Instant Delivery & Security</h2>
          <p>
            Orders are delivered electronically via the authenticated customer dashboard vault. The buyer is responsible for securing their account and following our &ldquo;Before You Buy&rdquo; security guidelines immediately following credential revelation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">4. Independent Operation & Trademarks</h2>
          <p>
            Ghost Alts is an independent digital marketplace and is not affiliated with, endorsed by, or sponsored by Mojang Studios or Microsoft Corporation. Minecraft is a registered trademark of Microsoft Corporation.
          </p>
        </section>
      </div>
    </div>
  );
}

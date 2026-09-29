import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Refund & Replacement Policy — Ghost Alts',
  description: 'Ghost Alts guarantee and replacement conditions for digital accounts.',
};

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          Refund & Replacement Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">1. Working Upon Delivery Guarantee</h2>
          <p>
            All digital accounts purchased through Ghost Alts are guaranteed to be working and accessible upon automated delivery. If invalid credentials occur at the time of delivery, our support desk will verify and provide a working replacement without extra charge.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">2. Replacement Window & Eligibility</h2>
          <p>
            Buyers must submit a ticket within 24 hours of delivery if an issue is encountered. The buyer must provide their Order ID and describe the error code received on the official launcher.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">3. Exclusions</h2>
          <p>
            Replacements or refunds will not be granted if:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The buyer receives in-game bans after successful delivery due to third-party cheats or hacks.</li>
            <li>The buyer alters security details or attempts recovery on an NFA account, violating the transparent product limitations.</li>
            <li>Chargebacks or payment disputes opened without contacting customer support first.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">4. Initiating a Claim</h2>
          <p>
            To initiate an inquiry or replacement request, please visit{' '}
            <Link href="/support" className="text-emerald-600 font-semibold underline">
              Support Center
            </Link>{' '}
            and select &ldquo;Replacement Request&rdquo;.
          </p>
        </section>
      </div>
    </div>
  );
}

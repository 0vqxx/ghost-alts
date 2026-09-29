import React from 'react';
import { ShieldCheck, AlertOctagon } from 'lucide-react';

export const metadata = {
  title: 'Acceptable Use Policy — Ghost Alts',
  description: 'Ghost Alts marketplace integrity and anti-compromised account policy.',
};

export default function AcceptableUsePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          Acceptable Use Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-primary">Zero-Tolerance Stance on Unauthorized Accounts</h3>
            <p className="text-slate-600 leading-relaxed">
              Ghost Alts strictly enforces marketplace standards requiring sellers to possess full transfer authorization. Stolen, compromised, cracked, phished, or database-leaked accounts are strictly prohibited from our platform.
            </p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">1. Prohibited Items and Conduct</h2>
          <p>The following activities and goods will result in immediate permanent termination:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Listing accounts acquired through unauthorized credential stuffing, malware, or phishing.</li>
            <li>Distributing or sharing compromised session tokens or authentication cookies.</li>
            <li>Using bot scripts to overload or scrape checkout systems.</li>
            <li>Attempting fraudulent credit card chargebacks.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">2. Audit & Verification Standards</h2>
          <p>
            Suppliers and sellers undergo routine validation to demonstrate legitimate custody of digital inventory before listings go live in the Ghost Alts catalog. Any listings identified as violating these rules are purged immediately.
          </p>
        </section>
      </div>
    </div>
  );
}

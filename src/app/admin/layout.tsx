import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, getDiscordAvatar } from '@/lib/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { ShieldAlert, ArrowLeft, Lock, ShieldCheck, ExternalLink, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/admin');
  }

  // Strict Discord ID Whitelist check
  const isWhitelisted =
    session.role === 'ADMIN' &&
    ((session.discordId && ['722126662241746964', '1453283693761138772'].includes(session.discordId)) ||
      session.username === 'Bell');

  if (!isWhitelisted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(35, 20, 90, 0.45) 0%, transparent 65%), #07061a',
        }}
      >
        <div className="w-full max-w-md bg-[#0a1224] border border-white/10 rounded-3xl p-8 space-y-6 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-md">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold uppercase tracking-wider">
              <Lock size={12} /> Restricted Access
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Access Restricted
            </h1>
            <p className="text-xs text-white/50 leading-relaxed font-sans">
              Your account (<strong className="text-white">@{session.username}</strong>
              {session.discordId ? ` • ID: ${session.discordId}` : ''}) is not whitelisted for the GhostAlts Administration Vault.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col antialiased selection:bg-[#5a61e2]/30 selection:text-white">
      {/* Sleek Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#07090e]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:border-[#737bea]/50 transition-colors">
                <ShieldCheck size={16} className="text-[#968bf7]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">ghostalts</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 border border-white/[0.08]">
                  admin
                </span>
              </div>
            </Link>

            <span className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-white/60">Systems Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <img
                src={getDiscordAvatar(session)}
                alt={session.username}
                className="w-5 h-5 rounded-full bg-white/10 shrink-0 object-cover border border-white/10"
              />
              <span className="text-xs font-semibold text-white/80">@{session.username}</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
            >
              <span>Storefront</span>
              <ExternalLink size={12} className="opacity-60" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-3 sticky top-24">
            <AdminNav />
          </aside>
          <main className="lg:col-span-9 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

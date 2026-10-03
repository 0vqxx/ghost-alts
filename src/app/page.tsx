import Link from 'next/link';
import { ArrowRight, Zap, ShieldCheck, Coins } from 'lucide-react';
import { getCatalog } from '@/lib/catalog';
import { getSession } from '@/lib/auth';
import { db, withDbTimeout } from '@/lib/db';
import { ProductCard } from '@/components/store/ProductCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  let products: any[] = [];
  let session = null;
  let availableInventoryCount = 0;
  let soldCount = 0;

  try {
    const [p, s, avail, sold] = await Promise.all([
      withDbTimeout(getCatalog(), [], 2500),
      getSession().catch(() => null),
      withDbTimeout(db.inventoryItem.count({ where: { status: 'AVAILABLE' } }), 0, 2500),
      withDbTimeout(db.inventoryItem.count({ where: { status: 'SOLD' } }), 0, 2500),
    ]);
    products = p || [];
    session = s || null;
    availableInventoryCount = Number(avail) || 0;
    soldCount = Number(sold) || 0;
  } catch (err) {
    console.error('Error fetching home page data:', err);
  }

  // Prioritize NFA accounts
  const nfaProducts = products.filter((p: any) => p.type === 'NFA' && p.stockCount > 0);
  const otherProducts = products.filter((p: any) => p.type !== 'NFA' && p.stockCount > 0);
  const featured = [...nfaProducts, ...otherProducts].slice(0, 8);
  
  // Real dynamic stock count
  const availableCount = availableInventoryCount > 0
    ? availableInventoryCount
    : products.reduce((acc: number, p: any) => acc + (p.stockCount || 0), 0);

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden flex flex-col bg-[#07061a]"
      style={{
        background: 'radial-gradient(ellipse 75% 55% at 50% 25%, rgba(115, 123, 234, 0.12) 0%, transparent 65%), #07061a',
      }}
    >
      {/* Background ambient lighting */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 8%, rgba(129, 137, 238, 0.05), transparent 34%)',
        }}
      />

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Top Hero Section matching enchantalts.site */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center mb-16 sm:mb-24">
          {/* Left Column: Headline and CTAs */}
          <div className="text-center lg:text-left lg:col-span-6 xl:col-span-5">
            {/* Live Status Pill with Real Stats */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#737bea]/30 bg-[#737bea]/10 text-[#968bf7] text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#737bea] animate-pulse" />
              <span>LIVE · {availableCount} AVAILABLE · {soldCount} SOLD</span>
            </div>

            {/* Giant Brand Headline */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl xl:text-9xl font-extrabold tracking-tight leading-[0.92] mb-5 sm:mb-6">
              <span className="text-[#737bea] block">ghost</span>
              <span className="text-white block">alts</span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed font-sans">
              Browse available Minecraft accounts and view your purchases from one dashboard. Listings appear here only when real account stock is ready for delivery.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
              <Link
                href="/shop"
                className="px-7 py-3.5 rounded-xl bg-[#5a61e2] hover:bg-[#6c74eb] text-white font-bold uppercase tracking-wide text-sm transition-all shadow-[0_0_25px_rgba(90,97,226,0.35)] cursor-pointer"
              >
                BROWSE ACCOUNTS
              </Link>

              {session ? (
                <Link
                  href="/dashboard"
                  className="px-7 py-3.5 rounded-xl border border-[#737bea]/30 hover:border-[#737bea]/60 text-white font-bold uppercase tracking-wide text-sm transition-all bg-[#737bea]/10 hover:bg-[#737bea]/20 cursor-pointer flex items-center gap-2"
                >
                  DASHBOARD
                </Link>
              ) : (
                <a
                  href="https://discord.gg/ghostalts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-7 py-3.5 rounded-xl border border-white/15 hover:border-white/30 text-white font-bold uppercase tracking-wide text-sm transition-all bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer flex items-center gap-2"
                >
                  DISCORD
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Hero Creeper Visual matching Discord Avatar (Big & Transparent) */}
          <div className="relative hidden lg:flex items-center justify-center lg:col-span-6 xl:col-span-7 h-[560px] xl:h-[620px] w-full pointer-events-none select-none" aria-hidden="true">
            {/* Ambient cyan and violet backlights */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-[#00e5ff]/20 rounded-full blur-[110px] pointer-events-none" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] bg-[#737bea]/25 rounded-full blur-[90px] pointer-events-none" />

            {/* Floating Ice Crystal Creeper (Bigger and 100% transparent background) */}
            <div className="relative z-10 w-[28rem] xl:w-[36rem] 2xl:w-[42rem] anim-float flex items-center justify-center">
              <img
                src="/ghost-creeper-hero.png?v=3"
                alt="GhostAlts Crystal Creeper"
                loading="eager"
                className="w-full h-auto object-contain pointer-events-none select-none drop-shadow-[0_20px_50px_rgba(0,229,255,0.35)]"
              />
            </div>
          </div>
        </div>

        {/* 3 Feature Cards matching enchantalts.site */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-14 max-w-5xl mx-auto w-full">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-5 text-left hover:border-white/20 transition-all">
            <div className="text-[#968bf7] text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Coins size={14} className="text-[#737bea]" />
              LTC (LITECOIN) CHECKOUT
            </div>
            <div className="text-white/60 text-sm leading-relaxed">
              Pay in Litecoin with low network fees. Fast on-chain confirmations unlock credentials in seconds.
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-5 text-left hover:border-white/20 transition-all">
            <div className="text-[#968bf7] text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-400" />
              RESERVATION LOCK
            </div>
            <div className="text-white/60 text-sm leading-relaxed">
              30-min hold per account. Only one buyer can checkout at a time with automatic release.
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-5 text-left hover:border-white/20 transition-all">
            <div className="text-[#968bf7] text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#968bf7]" />
              ACCOUNT HISTORY
            </div>
            <div className="text-white/60 text-sm leading-relaxed">
              Re-view your credentials anytime from your secure dashboard and order history.
            </div>
          </div>
        </div>

        {/* Terms callout banner matching enchantalts.site */}
        <div className="max-w-3xl mx-auto mb-16 px-2">
          <div className="bg-red-500/[0.06] border border-red-500/25 rounded-xl p-5">
            <div className="text-red-300 text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span>⚠️</span>
              Terms · Read before purchasing
            </div>
            <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
              Once an account is purchased, <strong className="text-white">we are not responsible for it</strong>. All accounts are <strong className="text-white">incidental</strong> and provided <strong className="text-white">as-is</strong> with <strong className="text-white">no lock warranty</strong>. Deliveries are verified at checkout so we can assist with disputed issues.
            </p>
          </div>
        </div>

        {/* Featured Storefront Grid */}
        <section className="pt-6">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/[0.08]">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#737bea]">
                LIVE INVENTORY
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Featured Accounts
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-bold text-white/60 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View All Accounts</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Product Cards Grid */}
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#737bea]/10 border border-[#737bea]/20 flex items-center justify-center text-[#737bea]">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Restocking Accounts</h3>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                No accounts are listed right now. Join our Discord to hear when verified stock is added.
              </p>
              <div className="mt-5">
                <a
                  href="https://discord.gg/ghostalts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5a61e2] hover:bg-[#6c74eb] text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Join Discord
                </a>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

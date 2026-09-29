import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Check, ArrowUpRight, Globe, KeyRound, Headphones, ShieldCheck, Zap } from 'lucide-react';
import { db, withDbTimeout } from '@/lib/db';
import { stringList, FALLBACK_ACCOUNTS } from '@/lib/catalog';
import { maskIGN, formatPrice } from '@/lib/utils';
import { SkinViewer } from '@/components/minecraft/SkinViewer';
import { NameMCCapeIcon } from '@/components/minecraft/CapeGraphic';
import { ProductActions } from '@/components/product/ProductActions';

type Props = { params: Promise<{ slug: string }> };

async function findListing(slug: string) {
  try {
    const fromDb = await withDbTimeout(
      db.product.findFirst({ where: { active: true, OR: [{ id: slug }, { slug }] } }),
      null,
      300
    );
    if (fromDb) return fromDb;
  } catch {}
  return (FALLBACK_ACCOUNTS.find((p) => p.id === slug || p.slug === slug) as any) || null;
}

export async function generateMetadata({ params }: Props) {
  const p = await findListing((await params).slug);
  return {
    title: p
      ? (p.blurName ? maskIGN(p.skinUsername) : p.name) + ' — Ghost Alts'
      : 'Account not found — Ghost Alts',
  };
}

export default async function AccountPage({ params }: Props) {
  const { slug } = await params;
  const p = await findListing(slug);
  if (!p) notFound();
  if (slug !== p.id) redirect('/shop/' + p.id);

  const product = {
    ...p,
    capes: stringList(p.capes),
    features: stringList(p.features),
    includedFeatures: stringList(p.includedFeatures),
    excludedFeatures: stringList(p.excludedFeatures),
    acceptedCryptos: stringList(p.acceptedCryptos),
  };
  const available = (p.stockCount ?? 1) > 0;

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden flex flex-col"
      style={{
        background: 'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(35, 20, 90, 0.45) 0%, transparent 65%), #07061a',
      }}
    >
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </Link>

        {/* Listing Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
                {p.blurName ? maskIGN(p.skinUsername) : p.name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#737bea]/20 text-[#968bf7] border border-[#737bea]/30">
                {p.type}
              </span>
            </div>
            <p className="text-xs font-mono text-white/50">
              IGN: {p.blurName ? maskIGN(p.skinUsername) : p.skinUsername}
            </p>
          </div>

          <span className="text-xs font-mono text-white/40">
            Listed {new Date(p.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Skin Stage */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1224] p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    available
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {available ? 'In Stock' : 'Sold Out'}
                </span>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Skin Preview
                </span>
              </div>

              <div className="h-64 flex items-center justify-center drop-shadow-[0_16px_32px_rgba(0,0,0,0.8)]">
                <SkinViewer skinUsername={p.skinUsername || 'Steve'} size="xl" mode="bust" />
              </div>

              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-10">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#5ad2d1]/15 text-[#5ad2d1] border border-[#5ad2d1]/30">
                  {p.rank || 'NON'}
                </span>
                <span className="text-xs font-mono text-white/50">{p.edition || 'Java & Bedrock'}</span>
              </div>
            </div>

            {/* About Account */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1224] p-6 space-y-4">
              <h3 className="text-base font-extrabold text-white">About This Account</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                {p.description || 'Verified Minecraft Java & Bedrock Edition account ready for instant launcher play.'}
              </p>

              {product.includedFeatures && product.includedFeatures.length > 0 && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.includedFeatures.map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/80">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cape Collection */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1224] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">Cape Collection</h3>
                <span className="text-xs font-mono font-bold text-[#968bf7]">
                  {product.capes.length} Capes
                </span>
              </div>

              {product.capes.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {product.capes.map((c: string) => (
                    <div
                      key={c}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10"
                    >
                      <NameMCCapeIcon cape={c} size="md" />
                      <span className="text-xs font-bold text-white">{c}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40">No special capes equipped on this account.</p>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-5">
            {/* Purchase Panel */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1224] p-6 space-y-5 shadow-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                  Account Price
                </span>
                <div className="text-3xl font-black text-white font-mono tabular-nums mt-1">
                  ${p.price.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2.5 text-xs border-t border-b border-white/10 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Type</span>
                  <span className="font-bold text-white uppercase">{p.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Delivery</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Zap size={11} /> Instant Crypto
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Warranty</span>
                  <span className="font-bold text-white">24h Replacement</span>
                </div>
              </div>

              <ProductActions product={product} />

              <p className="text-[11px] text-white/40 text-center leading-relaxed">
                Automated credential delivery to your screen and receipt email upon transaction confirmation.
              </p>
            </div>

            {/* Help Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <Headphones size={18} className="text-[#968bf7]" />
                <h4 className="text-sm font-bold text-white">Questions Before Buying?</h4>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                Open a ticket at our Support Desk anytime for assistance or warranty coverage.
              </p>
              <Link
                href="/support"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#968bf7] hover:text-white transition-colors"
              >
                <span>Go to Support Desk</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

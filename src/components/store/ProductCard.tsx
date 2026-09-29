'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Heart, ArrowUpRight, ShoppingBag, Check, ShieldCheck, Zap } from 'lucide-react';
import { ProductItem } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { SkinViewer } from '@/components/minecraft/SkinViewer';
import { NameMCCapeIcon } from '@/components/minecraft/CapeGraphic';

function RankBadge({ rank }: { rank?: string | null }) {
  if (!rank || rank.toUpperCase() === 'NON' || rank.toUpperCase() === 'NONE') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight bg-white/[0.08] text-white/60 border border-white/10">
        NON
      </span>
    );
  }

  const r = rank.toUpperCase();
  if (r.includes('MVP++')) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight bg-[#FFA500]/15 text-[#FFA500] border border-[#FFA500]/30 shadow-[0_0_10px_rgba(255,165,0,0.2)]">
        <span className="text-[#00FFFF]">MVP</span><span className="text-[#FF0000]">++</span>
      </span>
    );
  }
  if (r.includes('MVP+')) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight bg-[#5ad2d1]/15 text-[#5ad2d1] border border-[#5ad2d1]/30 shadow-[0_0_10px_rgba(90,210,209,0.2)]">
        MVP<span className="text-[#FFD700]">+</span>
      </span>
    );
  }
  if (r.includes('MVP')) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight bg-[#5ad2d1]/15 text-[#5ad2d1] border border-[#5ad2d1]/30">
        MVP
      </span>
    );
  }
  if (r.includes('VIP+')) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/30 shadow-[0_0_10px_rgba(0,255,0,0.2)]">
        VIP<span className="text-[#FFD700]">+</span>
      </span>
    );
  }
  if (r.includes('VIP')) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight bg-[#55FF55]/15 text-[#55FF55] border border-[#55FF55]/30">
        VIP
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight bg-[#737bea]/15 text-[#737bea] border border-[#737bea]/30">
      {rank}
    </span>
  );
}

export function ProductCard({ product }: { product: ProductItem }) {
  const { addItem } = useCart();
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const available = product.active && product.stockCount > 0;

  useEffect(() => {
    try {
      setLiked(JSON.parse(localStorage.getItem('ghostalts_favorites') || '[]').includes(product.id));
    } catch {}
  }, [product.id]);

  function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    try {
      const saved = JSON.parse(localStorage.getItem('ghostalts_favorites') || '[]') as string[];
      localStorage.setItem(
        'ghostalts_favorites',
        JSON.stringify(next ? [...new Set([...saved, product.id])] : saved.filter((id) => id !== product.id))
      );
    } catch {}
  }

  const isBlurred = Boolean(product.blurName);

  return (
    <article className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#0a1224] hover:border-[#737bea]/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,0,0,0.65)]">
      {/* 3D Skin Stage */}
      <div className="relative overflow-hidden h-[210px] bg-gradient-to-b from-[#12121f] to-[#080b14] flex items-center justify-center">
        {/* Bottom smooth fade to card body */}
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-[#0a1224] to-transparent pointer-events-none z-[1]" />

        <Link
          href={`/shop/${product.id}`}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 flex items-center justify-center z-0 pt-2"
        >
          <div className="transform transition-transform duration-300 group-hover:scale-105 select-none drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]">
            <SkinViewer skinUsername={product.skinUsername || 'Steve'} size="lg" mode="bust" />
          </div>
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${
              available
                ? 'bg-[#5a61e2]/15 text-[#968bf7] border-[#5a61e2]/40'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-[#737bea] animate-pulse' : 'bg-red-400'}`} />
            {available ? 'AVAILABLE' : 'SOLD OUT'}
          </span>

          <button
            onClick={toggleLike}
            aria-label={liked ? 'Remove from favorites' : 'Save account'}
            aria-pressed={liked}
            className={`pointer-events-auto w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
              liked
                ? 'bg-rose-500/20 border-rose-400/40 text-rose-400'
                : 'bg-black/60 border-white/15 text-white/60 hover:bg-black/80 hover:text-white'
            }`}
          >
            <Heart size={13} className={liked ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Bottom Badges on Stage */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex items-end justify-between pointer-events-none">
          <RankBadge rank={product.rank} />

          <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold tabular-nums bg-white text-black shadow-md">
            <span className="text-black/40 text-[10px] mr-0.5">$</span>
            {product.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 p-3.5 bg-[#0a1224] text-left border-t border-white/[0.06] justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <Link
              href={`/shop/${product.id}`}
              className={`font-extrabold text-sm text-white group-hover:text-[#737bea] transition-colors truncate uppercase tracking-wide ${
                isBlurred ? 'filter blur-[3px] select-none hover:blur-none' : ''
              }`}
            >
              {product.name}
            </Link>
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/60">
              {product.type}
            </span>
          </div>

          {/* Authentic Specs (NO fake stats) */}
          <div className="flex items-center gap-2 text-[11px] text-white/50 font-mono mb-2">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck size={12} />
              Unbanned
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-white/70">
              <Zap size={11} className="text-amber-400" />
              Instant
            </span>
          </div>

          {/* Capes Display */}
          <div className="flex items-center gap-1 flex-wrap min-h-[24px] mb-3">
            {product.capes && product.capes.length > 0 ? (
              product.capes.slice(0, 4).map((c) => <NameMCCapeIcon key={c} cape={c} size="sm" />)
            ) : (
              <span className="text-[11px] text-white/35 font-mono">Standard Edition</span>
            )}
            {product.capes && product.capes.length > 4 && (
              <span className="text-[10px] font-bold text-[#737bea] bg-[#737bea]/10 px-1.5 py-0.5 rounded">
                +{product.capes.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <Link
            href={`/shop/${product.id}`}
            className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-colors border-[#737bea]/30 bg-[#737bea]/10 text-[#968bf7] hover:bg-[#737bea]/20"
          >
            <span>View</span>
            <ArrowUpRight size={13} />
          </Link>

          <button
            disabled={!available}
            onClick={() => {
              addItem(product, 1);
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
            aria-label={`Add ${product.name} to cart`}
            className={`shrink-0 grid h-9 w-9 place-items-center rounded-lg border transition-all ${
              added
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/70 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {added ? <Check size={14} className="text-emerald-400" /> : <ShoppingBag size={14} />}
          </button>
        </div>
      </div>
    </article>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, subtotal, clearCart } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
      />

      {/* Slide-over Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-w-md bg-[#0a1224] border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col h-full animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#737bea]/20 border border-[#737bea]/40 flex items-center justify-center text-[#968bf7]">
              <ShoppingBag size={16} />
            </div>
            <h2 className="text-base font-extrabold text-white">Cart</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-white/80">
              {items.length}
            </span>
          </div>

          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {items.length > 0 ? (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all flex items-center gap-3.5 group"
              >
                {/* Minecraft Avatar */}
                <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={`https://mc-heads.net/avatar/${encodeURIComponent(product.skinUsername || 'Steve')}/48`}
                    alt={product.name}
                    className="w-9 h-9 rounded object-contain image-rendering-pixelated"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      onClick={closeCart}
                      href={`/shop/${product.id}`}
                      className="font-extrabold text-sm text-white hover:text-[#737bea] transition-colors truncate block"
                    >
                      {product.name}
                    </Link>
                    <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#737bea]/15 text-[#737bea] border border-[#737bea]/30">
                      {product.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                    <span>
                      {quantity > 1 ? `${quantity} × ` : ''}
                      <strong className="text-white">${product.price.toFixed(2)}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 text-[11px] flex items-center gap-0.5">
                      <ShieldCheck size={11} /> Unbanned
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeItem(product.id)}
                  aria-label={`Remove ${product.name}`}
                  className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-rose-500/20 hover:border-rose-500/40 text-white/40 hover:text-rose-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/20 mb-4">
                <ShoppingBag size={28} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Your cart is empty</h3>
              <p className="text-xs text-white/50 max-w-xs mb-6">
                Browse our live store inventory and choose your next verified Minecraft main or alt.
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Browse Accounts
              </Link>
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <footer className="p-5 border-t border-white/10 bg-black/50 space-y-4 shrink-0">
            {/* Guarantee Tag */}
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50 px-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap size={12} className="text-amber-400" /> Instant Crypto Fulfillment
              </span>
              <span>LTC / BTC / USDT</span>
            </div>

            {/* Subtotal */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-white/50 block">Subtotal</span>
                <span className="text-[10px] text-white/35 font-mono">Taxes included</span>
              </div>
              <div className="text-2xl font-black text-white font-mono tabular-nums">
                {formatPrice(subtotal)}
              </div>
            </div>

            {/* Checkout Action Button */}
            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3.5 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(115,123,234,0.4)]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} />
              </Link>

              <button
                onClick={clearCart}
                className="w-full py-1 text-center text-[11px] text-white/40 hover:text-white transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

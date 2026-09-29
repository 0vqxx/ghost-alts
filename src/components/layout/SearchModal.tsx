'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  type: string;
  edition: string;
  price: number;
  badge?: string | null;
}

export function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      if (query.trim().length >= 1) {
        setLoading(true);
        try {
          const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.products || []);
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface/95 backdrop-blur-2xl border border-card-border rounded-3xl shadow-2xl overflow-hidden z-10 animate-fadeIn text-primary">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-card-border font-mono">
          <Search className="w-5 h-5 text-emerald-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search MCFA, NFA, Hypixel, Capes..."
            autoFocus
            className="w-full bg-transparent text-primary placeholder:text-secondary/50 text-sm focus:outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-secondary hover:text-primary p-1 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[10px] font-mono font-semibold text-secondary bg-soft border border-card-border px-2 py-1 rounded-md hover:text-primary hover:bg-accent-soft transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results / Quick links */}
        <div className="max-h-80 overflow-y-auto p-3 font-mono">
          {query.trim().length === 0 ? (
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-secondary font-bold mb-2.5">
                Popular Categories
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/store/mcfa"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-soft hover:bg-emerald-500/10 border border-card-border hover:border-emerald-500/30 text-primary hover:text-emerald-500 text-xs font-semibold transition-colors"
                >
                  💎 Full Access (MCFA)
                </Link>
                <Link
                  href="/store/nfa"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-soft hover:bg-accent-soft border border-card-border text-primary text-xs font-semibold transition-colors"
                >
                  ⚡ Budget NFA
                </Link>
                <Link
                  href="/store?cape=Migrator"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-soft hover:bg-rose-500/10 border border-card-border hover:border-rose-500/30 text-primary hover:text-rose-500 text-xs font-semibold transition-colors"
                >
                  🔴 Migrator Capes
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="p-6 text-center text-xs text-secondary font-mono">Searching vault accounts...</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-xs text-secondary font-mono">
              No matching accounts found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-soft transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        product.type === 'MCFA'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-soft text-secondary border border-card-border'
                      }`}
                    >
                      {product.type}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-primary group-hover:text-emerald-500 transition-colors">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-secondary">{product.edition}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-secondary group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

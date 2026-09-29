'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Check,
  PackageSearch,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ProductItem } from '@/lib/types';
import { ProductCard } from './ProductCard';

const SORT_OPTIONS = [
  { key: 'default', label: 'Default' },
  { key: 'newest', label: 'Newest' },
  { key: 'low', label: 'Price — low to high' },
  { key: 'high', label: 'Price — high to low' },
];

export function StoreCatalog({
  initialProducts,
  initialType = 'All',
}: {
  initialProducts: ProductItem[];
  initialType?: string;
}) {
  const [type, setType] = useState(initialType);
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hypixelOnly, setHypixelOnly] = useState(false);
  const [rankedOnly, setRankedOnly] = useState(false);
  const [sort, setSort] = useState('default');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetFilters = () => {
    setType('All');
    setQuery('');
    setMinPrice('');
    setMaxPrice('');
    setHypixelOnly(false);
    setRankedOnly(false);
    setSort('default');
  };

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);

    return initialProducts
      .filter((p) => {
        // Type filter
        if (type !== 'All' && p.type !== type) return false;

        // Query search
        if (q) {
          const matchTarget = [p.name, p.skinUsername, p.rank, ...(p.capes || [])]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!matchTarget.includes(q)) return false;
        }

        // Price range
        if (min !== null && !isNaN(min) && p.price < min) return false;
        if (max !== null && !isNaN(max) && p.price > max) return false;

        // Flags
        if (hypixelOnly && p.hypixelBanned) return false;
        if (rankedOnly && (!p.rank || p.rank.toUpperCase() === 'NON' || p.rank.toUpperCase() === 'NONE')) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === 'low') return a.price - b.price;
        if (sort === 'high') return b.price - a.price;
        if (sort === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return 0;
      });
  }, [initialProducts, type, query, minPrice, maxPrice, hypixelOnly, rankedOnly, sort]);

  // Dynamic live numbers (NO fake data)
  const totalCount = filteredProducts.length;
  const availableCount = filteredProducts.filter((p) => p.active && p.stockCount > 0).length;
  const avgPrice =
    totalCount > 0
      ? (
          filteredProducts.reduce((sum, p) => sum + (p.price || 0), 0) / totalCount
        ).toFixed(2)
      : '0.00';

  const typeCounts = useMemo(() => {
    return {
      All: initialProducts.length,
      NFA: initialProducts.filter((p) => p.type === 'NFA').length,
      MCFA: initialProducts.filter((p) => p.type === 'MCFA').length,
    };
  }, [initialProducts]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label || 'Default';
  const hasActiveFilters =
    type !== 'All' ||
    query !== '' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    hypixelOnly ||
    rankedOnly ||
    sort !== 'default';

  return (
    <div className="w-full space-y-4">
      {/* Category Tabs Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'All', label: 'All Accounts' },
          { key: 'NFA', label: 'NFA Accounts (Fast Play)' },
          { key: 'MCFA', label: 'MCFA Accounts (Full Access)' },
        ].map((tab) => {
          const isActive = type === tab.key;
          const count = typeCounts[tab.key as keyof typeof typeCounts] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setType(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shrink-0 flex items-center gap-2 ${
                isActive
                  ? 'bg-white/[0.1] text-white border-white/20 shadow-sm'
                  : 'bg-white/[0.02] text-white/55 border-white/10 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-mono tabular-nums ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Inventory Counter Bar (Competitor enchantalts.site style) */}
      <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
        <div className="rounded-lg bg-black/40 px-3 py-3 text-center">
          <div className="text-2xl sm:text-[26px] font-extrabold text-white tabular-nums leading-none">
            {totalCount}
          </div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/45 mt-1.5 font-bold">
            Total listings
          </div>
        </div>
        <div className="rounded-lg bg-black/40 px-3 py-3 text-center">
          <div className="text-2xl sm:text-[26px] font-extrabold text-white tabular-nums leading-none">
            ${avgPrice}
          </div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/45 mt-1.5 font-bold">
            Avg. price
          </div>
        </div>
        <div className="rounded-lg bg-black/40 px-3 py-3 text-center">
          <div className="text-2xl sm:text-[26px] font-extrabold text-emerald-400 tabular-nums leading-none">
            {availableCount}
          </div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/45 mt-1.5 font-bold">
            Available now
          </div>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username, rank, cape…"
            aria-label="Search listings by username"
            className="w-full bg-black border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60 focus:ring-2 focus:ring-[#737bea]/15 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div ref={sortRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSortOpen(!sortOpen)}
            className={`w-full sm:w-auto inline-flex items-center justify-between gap-2.5 bg-black rounded-lg pl-3 pr-2.5 py-2 text-sm text-white outline-none transition-colors min-w-[200px] border ${
              sortOpen ? 'border-white/40' : 'border-white/15 hover:border-white/30'
            }`}
          >
            <span className="text-white/45 text-[11px] uppercase tracking-wider font-bold shrink-0">Sort</span>
            <span className="flex-1 text-left text-white truncate text-xs sm:text-sm font-medium">
              {activeSortLabel}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-white/55 transition-transform duration-200 ${
                sortOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {sortOpen && (
            <div className="absolute right-0 z-30 mt-1.5 w-full sm:w-[240px] rounded-lg border border-white/15 bg-black shadow-[0_12px_32px_rgba(0,0,0,0.85)] overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSort(opt.key);
                    setSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm border-l-2 transition-colors ${
                    sort === opt.key
                      ? 'bg-white/[0.08] text-white border-[#737bea]'
                      : 'text-white/70 hover:bg-white/[0.04] hover:text-white border-transparent'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sort === opt.key && <Check size={14} className="text-[#737bea]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Range & Quick Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[11px] uppercase tracking-wider text-white/55 font-bold shrink-0">Price</span>
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0.00"
              aria-label="Minimum price"
              className="w-full bg-black border border-white/10 rounded-md pl-5 pr-2 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors tabular-nums"
            />
          </div>
          <span className="text-white/35 shrink-0">—</span>
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              aria-label="Maximum price"
              className="w-full bg-black border border-white/10 rounded-md pl-5 pr-2 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors tabular-nums"
            />
          </div>
          {(minPrice || maxPrice) && (
            <button
              onClick={() => {
                setMinPrice('');
                setMaxPrice('');
              }}
              className="shrink-0 text-[11px] uppercase tracking-wider text-white/40 hover:text-white font-bold transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Attribute Pills */}
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
          <button
            onClick={() => setHypixelOnly(!hypixelOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              hypixelOnly
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-black border-white/10 text-white/50 hover:text-white hover:border-white/20'
            }`}
          >
            <ShieldCheck size={13} />
            <span>Hypixel Unbanned</span>
          </button>

          <button
            onClick={() => setRankedOnly(!rankedOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              rankedOnly
                ? 'bg-[#737bea]/20 border-[#737bea]/40 text-[#968bf7]'
                : 'bg-black border-white/10 text-white/50 hover:text-white hover:border-white/20'
            }`}
          >
            <Sparkles size={13} />
            <span>Ranked Only</span>
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-mono text-white/50">
          Showing <strong className="text-white">{filteredProducts.length}</strong> accounts
        </span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-[#968bf7] hover:text-white transition-colors font-medium"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Catalog Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center my-6">
          <PackageSearch size={40} className="text-white/20 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No accounts match your criteria</h3>
          <p className="text-xs text-white/50 max-w-sm mb-4">
            Try adjusting your search query, price range, or toggles to view available accounts.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-bold transition-all"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

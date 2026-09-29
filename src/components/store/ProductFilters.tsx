'use client';

import React from 'react';
import { Filter, RotateCcw, Sparkles } from 'lucide-react';

interface FiltersState {
  type: string;
  edition: string;
  cape: string;
  rank: string;
  feature: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

interface ProductFiltersProps {
  filters: FiltersState;
  onChange: (newFilters: FiltersState) => void;
  onReset: () => void;
}

export function ProductFilters({ filters, onChange, onReset }: ProductFiltersProps) {
  const updateFilter = (key: keyof FiltersState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-surface border border-card-border rounded-2xl p-5 space-y-6 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-card-border">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary font-mono">
          <Filter className="w-3.5 h-3.5 text-accent" />
          <span>Filter Accounts</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-secondary hover:text-primary flex items-center gap-1 font-mono transition-colors cursor-pointer"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Account Type */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-secondary">
          Account Type
        </label>
        <div className="grid grid-cols-3 gap-1 bg-soft p-1 rounded-xl border border-card-border font-mono">
          {['NFA', 'All', 'MCFA'].map((t) => (
            <button
              key={t}
              onClick={() => updateFilter('type', t)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-colors text-center cursor-pointer ${
                filters.type === t
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Filter by Minecraft Capes */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-secondary flex items-center justify-between">
          <span>Official Capes</span>
          <span className="text-[10px] text-emerald-400 font-semibold">Cosmetics</span>
        </label>
        <select
          value={filters.cape}
          onChange={(e) => updateFilter('cape', e.target.value)}
          aria-label="Official Capes"
          className="w-full bg-soft border border-card-border text-xs font-mono text-primary rounded-xl px-3 py-2.5 focus:border-accent focus:outline-none cursor-pointer"
        >
          <option value="All" className="bg-surface text-primary">All / Any Cape</option>
          <option value="Migrator" className="bg-surface text-primary">Migrator Cape</option>
          <option value="Vanilla" className="bg-surface text-primary">Vanilla Cape</option>
          <option value="Cherry" className="bg-surface text-primary">Cherry Blossom Cape</option>
          <option value="15th" className="bg-surface text-primary">15th Anniversary Cape</option>
          <option value="HasCape" className="bg-surface text-primary">Any Cape (At least 1)</option>
        </select>
      </div>

      {/* Hypixel Rank */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-secondary">
          Hypixel Rank
        </label>
        <select
          value={filters.rank}
          onChange={(e) => updateFilter('rank', e.target.value)}
          aria-label="Hypixel Rank"
          className="w-full bg-soft border border-card-border text-xs font-mono text-primary rounded-xl px-3 py-2.5 focus:border-accent focus:outline-none cursor-pointer"
        >
          <option value="All" className="bg-surface text-primary">All Ranks</option>
          <option value="MVP++" className="bg-surface text-primary">[MVP++] Hypixel</option>
          <option value="MVP+" className="bg-surface text-primary">[MVP+] Hypixel</option>
          <option value="VIP+" className="bg-surface text-primary">[VIP+] Hypixel</option>
          <option value="Ranked" className="bg-surface text-primary">Any Rank</option>
          <option value="Unranked" className="bg-surface text-primary">Unranked (Clean)</option>
        </select>
      </div>

      {/* Minecraft Edition */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-secondary">
          Game Edition
        </label>
        <select
          value={filters.edition}
          onChange={(e) => updateFilter('edition', e.target.value)}
          aria-label="Game Edition"
          className="w-full bg-soft border border-card-border text-xs font-mono text-primary rounded-xl px-3 py-2.5 focus:border-accent focus:outline-none cursor-pointer"
        >
          <option value="All" className="bg-surface text-primary">All Editions</option>
          <option value="Java" className="bg-surface text-primary">Java Edition</option>
          <option value="Bedrock" className="bg-surface text-primary">Bedrock Edition</option>
          <option value="Java + Bedrock" className="bg-surface text-primary">Java + Bedrock (Dual)</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-secondary">
          Price Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2 font-mono">
          <input
            type="number"
            placeholder="Min ($)"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="w-full bg-soft border border-card-border text-xs text-primary placeholder-secondary rounded-xl px-3 py-2 focus:border-accent focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max ($)"
            value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-full bg-soft border border-card-border text-xs text-primary placeholder-secondary rounded-xl px-3 py-2 focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Sorting */}
      <div className="space-y-2 pt-2 border-t border-card-border">
        <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-secondary">
          Sort Accounts
        </label>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          aria-label="Sort Accounts"
          className="w-full bg-soft border border-card-border text-xs font-mono text-primary rounded-xl px-3 py-2.5 focus:border-accent focus:outline-none cursor-pointer"
        >
          <option value="recommended" className="bg-surface text-primary">Featured / High Demand</option>
          <option value="price-high" className="bg-surface text-primary">Price: High to Low</option>
          <option value="price-low" className="bg-surface text-primary">Price: Low to High</option>
          <option value="level" className="bg-surface text-primary">Hypixel Network Level</option>
          <option value="newest" className="bg-surface text-primary">Newest Added</option>
        </select>
      </div>
    </div>
  );
}

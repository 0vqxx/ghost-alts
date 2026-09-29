import React from 'react';

interface RankBadgeProps {
  rank: string | null | undefined;
  className?: string;
}

export function RankBadge({ rank, className = '' }: RankBadgeProps) {
  if (!rank) return null;

  if (rank === 'VIP') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] tracking-wide border border-emerald-500/30 bg-emerald-50 text-emerald-700 ${className}`}>
        [VIP]
      </span>
    );
  } else if (rank === 'VIP+') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] tracking-wide border border-emerald-500/30 bg-emerald-50 ${className}`}>
        <span className="text-emerald-700">[VIP</span>
        <span className="text-amber-600 font-black">+</span>
        <span className="text-emerald-700">]</span>
      </span>
    );
  } else if (rank === 'MVP') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] tracking-wide border border-sky-500/30 bg-sky-50 text-sky-700 ${className}`}>
        [MVP]
      </span>
    );
  } else if (rank === 'MVP+') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] tracking-wide border border-sky-500/30 bg-sky-50 ${className}`}>
        <span className="text-sky-700">[MVP</span>
        <span className="text-rose-600 font-black">+</span>
        <span className="text-sky-700">]</span>
      </span>
    );
  } else if (rank === 'MVP++') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] tracking-wide border border-amber-500/30 bg-amber-50 ${className}`}>
        <span className="text-amber-800">[MVP</span>
        <span className="text-sky-600 font-black">++</span>
        <span className="text-amber-800">]</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] tracking-wide border border-slate-200 bg-slate-100 text-slate-700 ${className}`}>
      [{rank}]
    </span>
  );
}

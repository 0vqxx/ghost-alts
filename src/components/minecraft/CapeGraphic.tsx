'use client';

import React from 'react';

export interface CapeGraphicProps {
  cape: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export function getCapeMeta(capeName: string) {
  const norm = (capeName || '').toLowerCase();

  if (norm.includes('cherry')) {
    return {
      name: 'Cherry Blossom',
      category: 'Special Event',
      year: '2023',
      bgGradient: 'from-[#802245] to-[#B84D74]',
      border: 'border-[#F472B6]/40',
      tagColor: 'text-[#DB2777] bg-[#FDF2F8] border-[#FBCFE8]',
      render: () => (
        <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
          {/* Cape Base */}
          <rect width="20" height="32" rx="1" fill="#781D3B" />
          <rect x="1" y="1" width="18" height="30" fill="#992C52" />
          <rect x="2" y="2" width="16" height="28" fill="#B33E67" />
          {/* Top Gold Clasp */}
          <rect x="4" y="0" width="12" height="2" fill="#E2E8F0" />
          <rect x="5" y="0" width="10" height="1" fill="#FFFFFF" />
          {/* Blossom Petals & Tree Branch Pattern */}
          <rect x="7" y="5" width="6" height="10" fill="#6B1426" />
          <rect x="5" y="10" width="10" height="4" fill="#6B1426" />
          <rect x="8" y="7" width="4" height="6" fill="#F472B6" />
          {/* Falling Blossom Petals */}
          <rect x="4" y="8" width="3" height="3" fill="#FFB7C5" />
          <rect x="13" y="11" width="3" height="3" fill="#FFC0CB" />
          <rect x="6" y="18" width="3" height="3" fill="#FFB7C5" />
          <rect x="11" y="21" width="3" height="3" fill="#FFC0CB" />
          <rect x="4" y="24" width="2" height="2" fill="#F472B6" />
          <rect x="14" y="26" width="3" height="3" fill="#FFD1DC" />
          {/* Bottom Gradient Fade */}
          <rect x="1" y="29" width="18" height="2" fill="#5E142B" />
        </svg>
      ),
    };
  }

  if (norm.includes('15th') || norm.includes('anniversary') || norm.includes('experience')) {
    return {
      name: '15th Anniversary',
      category: 'Anniversary',
      year: '2024',
      bgGradient: 'from-[#1B5E20] to-[#4CAF50]',
      border: 'border-[#22C55E]/40',
      tagColor: 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]',
      render: () => (
        <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
          {/* Cape Base */}
          <rect width="20" height="32" rx="1" fill="#1B4D1B" />
          <rect x="1" y="1" width="18" height="30" fill="#2E7D32" />
          <rect x="2" y="2" width="16" height="28" fill="#43A047" />
          {/* Top Clasp */}
          <rect x="4" y="0" width="12" height="2" fill="#CBD5E1" />
          {/* 15th Creeper Face Emblem */}
          <rect x="6" y="6" width="8" height="8" fill="#7CB342" />
          <rect x="6" y="7" width="2" height="2" fill="#143A14" />
          <rect x="12" y="7" width="2" height="2" fill="#143A14" />
          <rect x="8" y="9" width="4" height="4" fill="#143A14" />
          <rect x="7" y="11" width="2" height="4" fill="#143A14" />
          <rect x="11" y="11" width="2" height="4" fill="#143A14" />
          {/* "15" Pixel Motif */}
          <rect x="5" y="18" width="2" height="7" fill="#C8E6C9" />
          <rect x="9" y="18" width="6" height="2" fill="#C8E6C9" />
          <rect x="9" y="20" width="2" height="3" fill="#C8E6C9" />
          <rect x="9" y="23" width="6" height="2" fill="#C8E6C9" />
          <rect x="13" y="25" width="2" height="3" fill="#C8E6C9" />
          <rect x="9" y="27" width="6" height="2" fill="#C8E6C9" />
          {/* Bottom Hem */}
          <rect x="1" y="30" width="18" height="1" fill="#0D2E0D" />
        </svg>
      ),
    };
  }

  if (norm.includes('migrator')) {
    return {
      name: 'Migrator Cape',
      category: 'Official Mojang',
      year: '2021',
      bgGradient: 'from-[#7F1D1D] to-[#B91C1C]',
      border: 'border-[#EF4444]/40',
      tagColor: 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]',
      render: () => (
        <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
          {/* Deep Crimson Base */}
          <rect width="20" height="32" rx="1" fill="#4C0505" />
          <rect x="1" y="1" width="18" height="30" fill="#730A0A" />
          <rect x="2" y="2" width="16" height="28" fill="#8E1111" />
          {/* Silver Clasp */}
          <rect x="4" y="0" width="12" height="2" fill="#E2E8F0" />
          {/* Golden Migration 'M' / Piston Glyph */}
          <rect x="4" y="6" width="12" height="16" fill="#A31414" />
          <rect x="5" y="7" width="10" height="13" fill="#D97706" />
          <rect x="6" y="8" width="8" height="11" fill="#F59E0B" />
          <rect x="7" y="9" width="6" height="9" fill="#FDE68A" />
          <rect x="9" y="11" width="2" height="5" fill="#B45309" />
          <rect x="7" y="14" width="6" height="2" fill="#F59E0B" />
          <rect x="7" y="10" width="2" height="4" fill="#FFFFFF" />
          <rect x="11" y="10" width="2" height="4" fill="#FFFFFF" />
          {/* Bottom Trim */}
          <rect x="1" y="29" width="18" height="2" fill="#3B0303" />
        </svg>
      ),
    };
  }

  if (norm.includes('vanilla')) {
    return {
      name: 'Vanilla Cape',
      category: 'Official Mojang',
      year: '2022',
      bgGradient: 'from-[#1E3A8A] to-[#15803D]',
      border: 'border-[#3B82F6]/40',
      tagColor: 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]',
      render: () => (
        <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
          <rect width="20" height="32" rx="1" fill="#0F172A" />
          <rect x="1" y="1" width="18" height="10" fill="#38BDF8" />
          <rect x="2" y="2" width="16" height="8" fill="#60A5FA" />
          <rect x="4" y="3" width="6" height="3" fill="#FFFFFF" />
          <rect x="12" y="5" width="5" height="2" fill="#E0F2FE" />
          <rect x="1" y="11" width="18" height="7" fill="#15803D" />
          <rect x="2" y="12" width="16" height="5" fill="#22C55E" />
          <rect x="4" y="13" width="3" height="4" fill="#16A34A" />
          <rect x="11" y="14" width="4" height="3" fill="#4ADE80" />
          <rect x="1" y="18" width="18" height="13" fill="#451A03" />
          <rect x="2" y="19" width="16" height="11" fill="#78350F" />
          <rect x="5" y="22" width="3" height="3" fill="#92400E" />
          <rect x="11" y="24" width="4" height="3" fill="#581C87" />
          <rect x="13" y="20" width="3" height="3" fill="#92400E" />
          <rect x="4" y="0" width="12" height="2" fill="#CBD5E1" />
        </svg>
      ),
    };
  }

  if (norm.includes('minecon') || norm.includes('2011') || norm.includes('2012') || norm.includes('2013') || norm.includes('2015') || norm.includes('2016')) {
    const is2011 = norm.includes('2011');
    const is2012 = norm.includes('2012');
    const is2013 = norm.includes('2013');
    const is2015 = norm.includes('2015');
    const is2016 = norm.includes('2016');

    return {
      name: is2011 ? 'Minecon 2011' : is2012 ? 'Minecon 2012' : is2013 ? 'Minecon 2013' : is2015 ? 'Minecon 2015' : is2016 ? 'Minecon 2016' : 'Minecon Cape',
      category: 'Minecon Official',
      year: is2011 ? '2011' : is2012 ? '2012' : is2013 ? '2013' : is2015 ? '2015' : '2016',
      bgGradient: 'from-[#18181B] to-[#3F3F46]',
      border: 'border-amber-400/40',
      tagColor: 'text-amber-800 bg-amber-50 border-amber-200',
      render: () => (
        <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
          <rect width="20" height="32" rx="1" fill={is2011 ? '#7F1D1D' : is2012 ? '#0F172A' : is2013 ? '#064E3B' : is2015 ? '#1E293B' : '#2E1065'} />
          <rect x="1" y="1" width="18" height="30" fill={is2011 ? '#991B1B' : is2012 ? '#1E293B' : is2013 ? '#047857' : is2015 ? '#334155' : '#3B0764'} />
          <rect x="4" y="0" width="12" height="2" fill="#E2E8F0" />
          {is2011 && (
            <>
              <rect x="9" y="6" width="2" height="12" fill="#E2E8F0" />
              <rect x="7" y="18" width="6" height="2" fill="#F59E0B" />
              <rect x="9" y="20" width="2" height="4" fill="#78350F" />
            </>
          )}
          {is2012 && (
            <>
              <rect x="6" y="6" width="8" height="3" fill="#F59E0B" />
              <rect x="9" y="9" width="2" height="14" fill="#78350F" />
              <rect x="5" y="8" width="2" height="3" fill="#D97706" />
              <rect x="13" y="8" width="2" height="3" fill="#D97706" />
            </>
          )}
          {(!is2011 && !is2012) && (
            <>
              <rect x="5" y="8" width="10" height="10" fill="#E2E8F0" />
              <rect x="7" y="10" width="2" height="2" fill="#EF4444" />
              <rect x="11" y="10" width="2" height="2" fill="#EF4444" />
              <rect x="8" y="14" width="4" height="2" fill="#64748B" />
            </>
          )}
        </svg>
      ),
    };
  }

  if (norm.includes('twitch')) {
    return {
      name: 'Twitch Heart',
      category: 'Creator',
      year: '2024',
      bgGradient: 'from-[#581C87] to-[#9333EA]',
      border: 'border-[#A855F7]/40',
      tagColor: 'text-[#7E22CE] bg-[#FAF5FF] border-[#E9D5FF]',
      render: () => (
        <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
          <rect width="20" height="32" rx="1" fill="#3B0764" />
          <rect x="1" y="1" width="18" height="30" fill="#6B21A8" />
          <rect x="2" y="2" width="16" height="28" fill="#9333EA" />
          <rect x="4" y="0" width="12" height="2" fill="#E2E8F0" />
          <rect x="5" y="9" width="4" height="3" fill="#FFFFFF" />
          <rect x="11" y="9" width="4" height="3" fill="#FFFFFF" />
          <rect x="4" y="12" width="12" height="4" fill="#FFFFFF" />
          <rect x="6" y="16" width="8" height="3" fill="#FFFFFF" />
          <rect x="8" y="19" width="4" height="3" fill="#FFFFFF" />
          <rect x="9" y="22" width="2" height="2" fill="#FFFFFF" />
          <rect x="8" y="13" width="4" height="3" fill="#C084FC" />
        </svg>
      ),
    };
  }

  if (norm.includes('tiktok')) {
    return {
      name: 'TikTok Cape',
      category: 'Creator',
      year: '2024',
      bgGradient: 'from-[#0F172A] to-[#1E293B]',
      border: 'border-[#06B6D4]/40',
      tagColor: 'text-slate-800 bg-slate-50 border-slate-200',
      render: () => (
        <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
          <rect width="20" height="32" rx="1" fill="#030712" />
          <rect x="1" y="1" width="18" height="30" fill="#111827" />
          <rect x="2" y="2" width="16" height="28" fill="#1F2937" />
          <rect x="4" y="0" width="12" height="2" fill="#E2E8F0" />
          <rect x="6" y="9" width="6" height="12" fill="#06B6D4" />
          <rect x="8" y="9" width="6" height="12" fill="#EF4444" />
          <rect x="7" y="10" width="6" height="10" fill="#FFFFFF" />
          <rect x="9" y="12" width="2" height="6" fill="#111827" />
        </svg>
      ),
    };
  }

  if (norm.includes('pancake') || norm.includes('pan') || norm.includes('egg') || norm.includes('breakfast')) {
    return {
      name: 'Pancake Cape',
      category: 'Special Bedrock / Java',
      year: '2021',
      bgGradient: 'from-[#0284C7] to-[#38BDF8]',
      border: 'border-[#38BDF8]/40',
      tagColor: 'text-[#0369A1] bg-[#F0F9FF] border-[#BAE6FD]',
      render: () => (
        <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
          {/* Light Sky Blue / Cyan Base */}
          <rect width="20" height="32" rx="1" fill="#0369A1" />
          <rect x="1" y="1" width="18" height="30" fill="#0EA5E9" />
          <rect x="2" y="2" width="16" height="28" fill="#38BDF8" />
          {/* Silver Clasp */}
          <rect x="4" y="0" width="12" height="2" fill="#E2E8F0" />
          {/* Sunny-side up / Pancake stack */}
          {/* White egg albumen / base pancake */}
          <rect x="4" y="8" width="12" height="14" rx="2" fill="#FFFFFF" />
          <rect x="5" y="7" width="10" height="16" fill="#FFFFFF" />
          <rect x="3" y="10" width="14" height="10" fill="#F8FAFC" />
          {/* Golden Yolk / Butter Syrup */}
          <rect x="7" y="11" width="6" height="8" rx="1" fill="#F59E0B" />
          <rect x="8" y="10" width="4" height="10" fill="#F59E0B" />
          <rect x="6" y="13" width="8" height="4" fill="#D97706" />
          <rect x="8" y="12" width="2" height="2" fill="#FEF08A" />
          {/* Golden syrup drip */}
          <rect x="9" y="19" width="2" height="4" fill="#D97706" />
          {/* Bottom Hem */}
          <rect x="1" y="29" width="18" height="2" fill="#0284C7" />
        </svg>
      ),
    };
  }

  // Default Standard Mojang Cape
  return {
    name: capeName || 'Official Cape',
    category: 'Mojang Cape',
    year: 'Official',
    bgGradient: 'from-[#0F172A] to-[#334155]',
    border: 'border-slate-300',
    tagColor: 'text-slate-700 bg-slate-100 border-slate-200',
    render: () => (
      <svg viewBox="0 0 20 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <rect width="20" height="32" rx="1" fill="#0F172A" />
        <rect x="1" y="1" width="18" height="30" fill="#334155" />
        <rect x="2" y="2" width="16" height="28" fill="#475569" />
        <rect x="4" y="0" width="12" height="2" fill="#CBD5E1" />
        <rect x="9" y="10" width="2" height="8" fill="#F8FAFC" />
        <rect x="6" y="13" width="8" height="2" fill="#F8FAFC" />
      </svg>
    ),
  };
}

const sizeMap = {
  xs: 'w-3 h-4.5',
  sm: 'w-3.5 h-5.5',
  md: 'w-5 h-8',
  lg: 'w-8 h-12',
  xl: 'w-14 h-22',
};

export function CapeGraphic({ cape, size = 'sm', className = '' }: CapeGraphicProps) {
  const meta = getCapeMeta(cape);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 drop-shadow-xs rounded-[2px] overflow-hidden ${sizeMap[size]} ${className}`}
      title={`${meta.name} (${meta.category})`}
    >
      {meta.render()}
    </div>
  );
}

/**
 * NameMC Style Square Cape Badge (Matching Reference Screenshot)
 */
export function NameMCCapeIcon({
  cape,
  size = 'md',
  className = '',
}: {
  cape: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const meta = getCapeMeta(cape);

  const containerSizes = {
    sm: 'w-6 h-6 rounded-md p-0.5',
    md: 'w-7 h-7 rounded-lg p-0.5',
    lg: 'w-9 h-9 rounded-xl p-1',
  };

  const graphicSizes: Record<string, 'xs' | 'sm' | 'md'> = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
  };

  return (
    <div
      className={`inline-flex items-center justify-center bg-[#131b2c]/90 dark:bg-[#131b2c]/90 hover:bg-[#1c2740] border border-[#253556] dark:border-[#253556] shadow-xs cursor-pointer transition-transform hover:scale-105 select-none ${containerSizes[size]} ${className}`}
      title={`NameMC Verified: ${meta.name} (${meta.category} • ${meta.year})`}
    >
      <CapeGraphic cape={cape} size={graphicSizes[size]} />
    </div>
  );
}

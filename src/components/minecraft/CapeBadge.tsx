'use client';

import React from 'react';
import { CapeGraphic, getCapeMeta } from './CapeGraphic';

interface CapeBadgeProps {
  cape: string;
  size?: 'sm' | 'md' | 'lg';
  showGraphic?: boolean;
  className?: string;
}

export function CapeBadge({
  cape,
  size = 'sm',
  showGraphic = true,
  className = '',
}: CapeBadgeProps) {
  const meta = getCapeMeta(cape);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5',
  };

  const graphicSize = size === 'lg' ? 'md' : size === 'md' ? 'sm' : 'xs';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono font-semibold tracking-tight shadow-2xs transition-all ${meta.tagColor} ${sizeClasses[size]} ${className}`}
      title={`${meta.name} — ${meta.category}`}
    >
      {showGraphic && (
        <CapeGraphic cape={cape} size={graphicSize} className="shrink-0" />
      )}
      <span className="truncate max-w-[130px] font-mono">{meta.name}</span>
    </span>
  );
}

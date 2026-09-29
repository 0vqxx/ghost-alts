'use client';

import React, { useState, useEffect } from 'react';

interface SkinViewerProps {
  skinUsername: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mode?: 'bust' | 'full';
  className?: string;
  showPedestal?: boolean;
}

export function SkinViewer({
  skinUsername,
  size = 'md',
  mode = 'bust',
  className = '',
  showPedestal = false,
}: SkinViewerProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setUnavailable(false);
  }, [skinUsername, mode]);

  const cleanUser = encodeURIComponent(skinUsername || 'Steve');

  // High-fidelity 3D Isometric CDNs (mc-heads, visage, crafatar)
  const bustSources = [
    `https://mc-heads.net/body/${cleanUser}/right`,
    `https://visage.surgeplay.com/bust/512/${cleanUser}`,
    `https://crafatar.com/renders/body/${cleanUser}?overlay`,
    `https://visage.surgeplay.com/full/512/${cleanUser}`,
    `https://mc-heads.net/body/${cleanUser}`,
  ];

  const fullSources = [
    `https://mc-heads.net/body/${cleanUser}/right`,
    `https://visage.surgeplay.com/full/512/${cleanUser}`,
    `https://crafatar.com/renders/body/${cleanUser}?overlay`,
    `https://mc-heads.net/body/${cleanUser}`,
  ];

  const currentSources = mode === 'bust' ? bustSources : fullSources;
  const currentSrc = currentSources[sourceIndex] || currentSources[0];

  const handleImgError = () => {
    if (sourceIndex < currentSources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    } else {
      setUnavailable(true);
    }
  };

  const sizeClasses = {
    sm: 'h-24 w-auto max-w-[100px]',
    md: 'h-36 w-auto max-w-[140px]',
    lg: 'h-44 w-auto max-w-[170px]',
    xl: 'h-60 w-auto max-w-[240px]',
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div
        className={`relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${sizeClasses[size]}`}
      >
        {unavailable ? (
          <div className="flex flex-col items-center gap-3 text-center text-xs text-slate-400">
            <img src="/logo-mint.png" alt="" className="w-16 h-16 object-contain" />
            <span>Skin preview unavailable</span>
          </div>
        ) : (
          <img
            src={currentSrc}
            alt={`Minecraft skin for ${cleanUser}`}
            onError={handleImgError}
            decoding="async"
            className="h-full w-auto object-contain drop-shadow-md select-none pointer-events-none"
            loading="lazy"
          />
        )}
      </div>

      {showPedestal && mode === 'full' && (
        <div className="w-16 h-1.5 bg-slate-400/20 dark:bg-slate-400/10 rounded-full blur-[2px] mt-[-3px]" />
      )}
    </div>
  );
}

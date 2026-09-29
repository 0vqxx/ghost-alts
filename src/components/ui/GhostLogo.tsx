'use client';

import React from 'react';

interface GhostLogoProps {
  className?: string;
  size?: number;
}

export function GhostLogo({ className = '', size = 24 }: GhostLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Ghost Alts Logo"
      width={size}
      height={size}
      className={`object-contain select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

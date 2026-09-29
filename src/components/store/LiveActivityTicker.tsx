'use client';

import React from 'react';
import { Zap } from 'lucide-react';

const RECENT_ACTIVITIES = [
  { user: 'xGamer***', item: 'MCFA • [MVP+] Migrator Cape', time: '2m ago' },
  { user: 'Void***', item: 'MCFA • Vanilla & Migrator Cape', time: '5m ago' },
  { user: 'Pixel***', item: 'MCFA • [MVP] Cherry Cape', time: '9m ago' },
  { user: 'Ghost***', item: 'NFA • Hypixel [VIP+] Clean', time: '14m ago' },
  { user: 'Shadow***', item: 'MCFA • 15th Anniversary Cape', time: '18m ago' },
  { user: 'Krona***', item: 'MCFA • Java + Bedrock Edition', time: '24m ago' },
];

export function LiveActivityTicker() {
  return (
    <div className="w-full bg-surface border-y border-card-border py-2.5 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
        {/* Live Status Pill */}
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-card-border font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-primary font-bold uppercase tracking-wider text-[11px]">Live Vault</span>
        </div>

        {/* Scrolling Items */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap text-xs font-mono text-secondary">
          {RECENT_ACTIVITIES.map((act, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span className="text-primary font-semibold">{act.user}</span>
              <span className="text-secondary/60">unlocked</span>
              <span className="text-primary/90 font-medium">{act.item}</span>
              <span className="text-secondary/50 text-[10px]">({act.time})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

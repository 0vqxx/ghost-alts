'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Gift,
  ExternalLink,
  Zap,
  ShieldCheck,
  Coins,
  LifeBuoy,
} from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const groups = [
    {
      title: 'Store Operations',
      links: [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Orders & Sales', href: '/admin/orders', icon: ShoppingBag },
        { label: 'Disputes & Tickets', href: '/admin/support', icon: LifeBuoy },
      ],
    },
    {
      title: 'Inventory & Vaults',
      links: [
        { label: 'MCFA Accounts', href: '/admin/stock/mcfa', icon: ShieldCheck },
        { label: 'NFA Accounts', href: '/admin/stock/nfa', icon: Zap },
        { label: 'Catalog Listings', href: '/admin/products', icon: Package },
        { label: 'All Raw Stock', href: '/admin/inventory', icon: Layers },
      ],
    },
    {
      title: 'Finance & Perks',
      links: [
        { label: 'Crypto Wallets', href: '/admin/payments', icon: Coins },
        { label: 'Free Drops Queue', href: '/admin/drops', icon: Gift },
      ],
    },
  ];

  return (
    <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-3.5 space-y-6 shadow-xl text-white">
      {groups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <div className="px-3 text-[10px] font-mono uppercase font-bold tracking-widest text-white/30">
            {group.title}
          </div>

          <nav className="space-y-0.5">
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white font-bold border-l-2 border-[#737bea] pl-2.5 shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.03] font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#968bf7]' : 'text-white/40'
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="pt-3 border-t border-white/[0.06] space-y-0.5">
        <Link
          href="/dashboard"
          className="flex items-center justify-between px-3 py-2 text-xs text-white/40 hover:text-white hover:bg-white/[0.03] rounded-xl transition-colors font-medium"
        >
          <span>User Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-50" />
        </Link>
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 text-xs text-white/40 hover:text-white hover:bg-white/[0.03] rounded-xl transition-colors font-medium"
        >
          <span>Live Store</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-50" />
        </Link>
      </div>
    </div>
  );
}

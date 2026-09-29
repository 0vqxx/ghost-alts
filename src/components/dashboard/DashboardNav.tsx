'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  KeyRound,
  Headphones,
  User,
  ShieldCheck,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

interface DashboardNavProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    discordId?: string;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const isWhitelistedAdmin =
    user.role === 'ADMIN' &&
    ((user.discordId && ['722126662241746964', '1453283693761138772'].includes(user.discordId)) ||
      user.username === 'Bell');

  const links = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Orders', href: '/dashboard/orders', icon: Package },
    { label: 'Purchases', href: '/dashboard/purchases', icon: KeyRound },
    { label: 'Support', href: '/dashboard/support', icon: Headphones },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
    { label: 'Security', href: '/dashboard/security', icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {}
  };

  return (
    <div className="bg-surface border border-card-border rounded-3xl p-5 space-y-6 shadow-sm font-mono text-primary">
      {/* User Header */}
      <div className="p-3.5 bg-soft border border-card-border rounded-2xl flex items-center gap-3">
        <img
          src={user.discordId ? `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(user.discordId) >> 22n) % 6n)}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
          alt={user.username}
          className="w-10 h-10 rounded-full bg-black/40 border border-white/10 shrink-0 object-cover"
        />
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-primary truncate">@{user.username}</p>
          <p className="text-[11px] text-secondary truncate">{user.email}</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold'
                  : 'text-secondary hover:text-primary hover:bg-soft'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Link ONLY if whitelisted admin */}
      {isWhitelistedAdmin && (
        <div className="pt-2 border-t border-card-border">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-purple-400" />
            <span>Admin Dashboard</span>
          </Link>
        </div>
      )}

      {/* Logout Button */}
      <div className="pt-2 border-t border-card-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

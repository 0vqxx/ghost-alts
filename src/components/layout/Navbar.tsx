'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Shield,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Package,
  ExternalLink,
} from 'lucide-react';
import { GhostLogo } from '@/components/ui/GhostLogo';
import { useCart } from '@/context/CartContext';
import { SessionUser } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { getDiscordAvatar } from '@/lib/utils';

export function Navbar({
  initialUser,
  totalSpent = 0,
}: {
  initialUser?: SessionUser | null;
  totalSpent?: number;
}) {
  const pathname = usePathname();
  const { openCart, itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [discordAvatar, setDiscordAvatar] = useState<string>(() => {
    return initialUser ? (initialUser.discordAvatar || initialUser.avatar || getDiscordAvatar(initialUser)) : '';
  });

  useEffect(() => {
    if (!initialUser) return;
    const base = initialUser.discordAvatar || initialUser.avatar || getDiscordAvatar(initialUser);
    setDiscordAvatar(base);

    if (initialUser.discordId) {
      const cacheKey = `discord_pfp_${initialUser.discordId}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setDiscordAvatar(cached);
          return;
        }
      } catch {}

      fetch(`/api/auth/discord-avatar?id=${encodeURIComponent(initialUser.discordId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.avatarUrl) {
            setDiscordAvatar(data.avatarUrl);
            try {
              localStorage.setItem(cacheKey, data.avatarUrl);
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [initialUser]);

  // Close mobile drawer on route change or Escape
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const links: Array<{ label: string; href: string; badge?: string; external?: boolean }> = [
    { label: 'Shop', href: '/shop' },
    { label: 'Free NFA', href: '/free-nfa', badge: 'FREE' },
    { label: 'Discord', href: 'https://discord.gg/ghostalts', external: true },
    { label: 'Support', href: '/support' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full pt-3 pb-2 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto h-[54px] rounded-full border border-white/10 bg-[#0a0f1d]/90 backdrop-blur-xl px-4 sm:px-5 flex items-center justify-between gap-4 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.7)]">
        {/* Brand matching enchantalts pure typography */}
        <Link
          className="flex items-center text-lg sm:text-xl font-black tracking-tight whitespace-nowrap shrink-0 group select-none"
          href="/"
          aria-label="ghostalts home"
        >
          <span className="text-[#737bea]">ghost</span>
          <span className="text-white">alts</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ label, href, badge, external }) => {
            const isActive =
              !external &&
              (pathname === href || (href === '/shop' && pathname === '/store'));

            if (external) {
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  {label}
                </a>
              );
            }

            return (
              <Link
                key={label}
                href={href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white/[0.12] text-white border border-white/10 shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <span>{label}</span>
                {badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Cart button */}
          <button
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-white/70 hover:text-white relative transition-all cursor-pointer"
            onClick={openCart}
            aria-label={`Cart (${itemCount})`}
          >
            <ShoppingBag size={14} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-[#10b981] text-black font-black text-[9px] rounded-full flex items-center justify-center px-0.5">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Auth Chip (matches screenshot chip with Minecraft skin avatar, name, and spent amount) */}
          {initialUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 transition-all cursor-pointer"
              >
                <img
                  src={discordAvatar || getDiscordAvatar(initialUser)}
                  alt={initialUser.username}
                  className="w-6 h-6 rounded-full bg-white/10 shrink-0 object-cover border border-white/15"
                />
                <div className="text-left leading-none hidden sm:block">
                  <span className="text-xs font-bold text-white block">
                    {initialUser.username}
                  </span>
                  <span className="text-[10px] text-white/45 font-medium">
                    Spent ${totalSpent.toFixed(2)}
                  </span>
                </div>
                <ChevronDown size={13} className="text-white/50 shrink-0 ml-0.5" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0a1224] border border-white/15 p-2 shadow-2xl z-50 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <span className="text-xs font-bold text-white block">
                      {initialUser.username}
                    </span>
                    <span className="text-[10px] text-white/40 truncate block">
                      {initialUser.email}
                    </span>
                  </div>

                  {initialUser.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/15 transition-colors"
                    >
                      <Shield size={13} />
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <User size={13} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/dashboard/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <Package size={13} />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    href="/api/auth/logout"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={13} />
                    <span>Log Out</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-bold text-white/80 hover:text-white hover:bg-white/[0.06] transition-all"
                href="/login"
              >
                Sign In
              </Link>
              <Link
                className="px-3.5 py-1.5 rounded-full bg-[#5a61e2] hover:bg-[#737bea] text-white font-black text-xs transition-all shadow-md"
                href="/register"
              >
                Create Account
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all ml-1 cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* Mobile / Responsive Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative z-10 w-full max-w-[320px] bg-[#0a1224] border-l border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-[#737bea]/20 border border-[#737bea]/30 flex items-center justify-center">
                  <GhostLogo size={16} />
                </div>
                <div className="font-extrabold text-sm">
                  <span className="text-[#737bea]">ghost</span>
                  <span className="text-white">alts</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* User Info / Auth */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
              {initialUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={discordAvatar || getDiscordAvatar(initialUser)}
                      alt={initialUser.username}
                      className="w-10 h-10 rounded-full bg-white/10 shrink-0 object-cover border border-white/15"
                    />
                    <div className="overflow-hidden">
                      <span className="text-sm font-bold text-white block truncate">
                        {initialUser.username}
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-medium block">
                        Spent ${totalSpent.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <User size={13} />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/dashboard/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Package size={13} />
                      <span>Orders</span>
                    </Link>
                    {initialUser.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="col-span-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Shield size={13} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-white/15 text-center text-xs font-bold text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] text-center text-xs font-black text-white transition-colors shadow-md"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 px-3 pb-1 block">
                Menu
              </span>
              {links.map(({ label, href, badge, external }) => {
                const isActive =
                  !external &&
                  (pathname === href || (href === '/shop' && pathname === '/store'));

                if (external) {
                  return (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <span>{label}</span>
                      <ExternalLink size={13} className="text-white/40" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-white/[0.12] text-white border border-white/10'
                        : 'text-white/80 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{label}</span>
                    {badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer Utilities */}
            <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openCart();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white/80 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ShoppingBag size={14} />
                <span>Cart ({itemCount})</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-10 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-white/80 cursor-pointer transition-colors"
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>

              {initialUser && (
                <Link
                  href="/api/auth/logout"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-9 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 flex items-center justify-center text-red-400 transition-colors"
                  title="Log Out"
                >
                  <LogOut size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

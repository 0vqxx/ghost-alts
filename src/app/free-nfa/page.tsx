'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SkinViewer } from '@/components/minecraft/SkinViewer';
import {
  Gift,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Radio,
  Play,
  Tv,
} from 'lucide-react';

export default function FreeNfaPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null);

  // Daily Claim State
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [dailyRemainingSeconds, setDailyRemainingSeconds] = useState(0);
  const [lastClaim, setLastClaim] = useState<any>(null);

  // Ad Unlock Claims State (1 ad = 1 account, max 3 per day)
  const [adClaimsToday, setAdClaimsToday] = useState(0);
  const [adClaimsMax, setAdClaimsMax] = useState(3);
  const [adClaimsRemaining, setAdClaimsRemaining] = useState(3);
  const [canClaimAd, setCanClaimAd] = useState(true);
  const [activeDropCount, setActiveDropCount] = useState(0);
  const [stockKnown, setStockKnown] = useState(false);

  const [claiming, setClaiming] = useState(false);
  const [newlyClaimed, setNewlyClaimed] = useState<{
    credentials: string;
    token?: string | null;
    claimType?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'combo' | 'token' | 'full'>('combo');
  const [isTokenRevealed, setIsTokenRevealed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Single Ad Watch Modal State
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  const [adPlaying, setAdPlaying] = useState(false);

  // Linkvertise Sponsor Link
  const LINKVERTISE_AD_URL = 'https://link-center.net/9636267/XRn3Q7rIokdM';
  const [hasOpenedLinkvertise, setHasOpenedLinkvertise] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/free-nfa/claim', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
        setUser(data.user);
        setCanClaimDaily(Boolean(data.canClaimDaily));
        setDailyRemainingSeconds(data.dailyRemainingSeconds || 0);
        setAdClaimsToday(data.adClaimsToday || 0);
        setAdClaimsMax(data.adClaimsMax || 3);
        setAdClaimsRemaining(data.adClaimsRemaining ?? Math.max(0, 3 - (data.adClaimsToday || 0)));
        setCanClaimAd(Boolean(data.canClaimAd));
        setLastClaim(data.lastClaim || null);
        setActiveDropCount(data.activeDropCount || 0);
        setStockKnown(res.ok);
        setError(res.ok ? '' : data.error || 'Claims are temporarily unavailable.');
      } else if (res.ok && data.authenticated === false) {
        setAuthenticated(false);
        setUser(null);
        setStockKnown(false);
        setError('');
      } else {
        throw new Error('Claim status unavailable');
      }
    } catch {
      // A claim-status outage must not be mistaken for a signed-out session.
      try {
        const sessionResponse = await fetch('/api/auth/me', { cache: 'no-store' });
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setAuthenticated(true);
          setUser(sessionData.user);
          setCanClaimDaily(false);
          setCanClaimAd(false);
          setActiveDropCount(0);
          setStockKnown(false);
          setError('Claims are temporarily unavailable. Your sign-in is still active.');
        } else {
          setAuthenticated(false);
        }
      } catch {
        setError('Could not check your sign-in right now. Please refresh this page.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Daily Cooldown countdown timer
  useEffect(() => {
    if (dailyRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setDailyRemainingSeconds((prev) => {
        if (prev <= 1) {
          setCanClaimDaily(stockKnown && activeDropCount > 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyRemainingSeconds, stockKnown, activeDropCount]);

  // Single Ad Timer countdown (5 seconds verification)
  useEffect(() => {
    if (!isAdModalOpen || !adPlaying) return;
    if (adTimer <= 0) return;

    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAdModalOpen, adPlaying, adTimer]);

  const handleDiscordLogin = () => {
    window.location.href = `/api/auth/discord?next=${encodeURIComponent('/free-nfa')}`;
  };

  const handleClaim = async (type: 'DAILY' | 'ADS' = 'DAILY') => {
    setError('');
    setClaiming(true);
    try {
      const res = await fetch('/api/free-nfa/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimType: type, adsCompleted: type === 'ADS' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim account');
      }

      setNewlyClaimed({
        credentials: data.credentials,
        token: data.token,
        claimType: data.claimType,
      });

      const remainingStock = Math.max(0, activeDropCount - 1);
      setActiveDropCount(remainingStock);

      if (type === 'DAILY') {
        setCanClaimDaily(false);
        setDailyRemainingSeconds(24 * 60 * 60);
      } else {
        setAdClaimsToday(data.adClaimsToday ?? adClaimsToday + 1);
        setAdClaimsRemaining(data.adClaimsRemaining ?? Math.max(0, adClaimsRemaining - 1));
        setCanClaimAd(remainingStock > 0 && (data.adClaimsRemaining ?? adClaimsRemaining - 1) > 0);
      }
      if (remainingStock === 0) setCanClaimAd(false);

      setIsAdModalOpen(false);
      setAdPlaying(false);
      setHasOpenedLinkvertise(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while claiming.');
    } finally {
      setClaiming(false);
    }
  };

  const startAdFlow = () => {
    if (!authenticated) {
      handleDiscordLogin();
      return;
    }
    if (!canClaimAd) {
      setError(stockKnown && activeDropCount === 0 ? 'No free accounts are in stock yet.' : 'Sponsor claims are unavailable right now.');
      return;
    }
    setHasOpenedLinkvertise(false);
    setAdTimer(5);
    setAdPlaying(false);
    setIsAdModalOpen(true);
  };

  const handleOpenLinkvertise = () => {
    window.open(LINKVERTISE_AD_URL, '_blank', 'noopener,noreferrer');
    setHasOpenedLinkvertise(true);
    setAdPlaying(true);
    setAdTimer(5);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  };

  const timeFormatted = formatTime(dailyRemainingSeconds);
  const currentCredentials = newlyClaimed?.credentials || lastClaim?.credentials || '';
  const currentToken = newlyClaimed?.token || lastClaim?.token || null;
  const usernameGuess = currentCredentials ? currentCredentials.split(':')[0] : 'Steve';

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden flex flex-col"
      style={{
        background: 'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(35, 20, 90, 0.45) 0%, transparent 65%), #07061a',
      }}
    >
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header matching enchantalts.site */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#737bea]/10 border border-[#737bea]/30 text-[#968bf7] text-[11px] font-bold uppercase tracking-wider mb-3">
              <Gift size={13} className="text-[#737bea]" />
              <span>Daily Drops &amp; Free Rewards</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Free Minecraft Drops
            </h1>
            <p className="text-white/55 mt-1.5 text-sm max-w-xl">
              When free stock is available, claim one NFA account every 24 hours or unlock bonus drops through sponsor links.
            </p>
          </div>

          {loading ? (
            <div className="px-4 py-2 text-xs text-white/50">Checking your session…</div>
          ) : authenticated ? (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">@{user?.username}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#8a9cf8] font-bold uppercase">
                Linked
              </span>
            </div>
          ) : (
            <button
              onClick={handleDiscordLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Login with Discord</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Claim Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: 24-Hour Free Daily Drop */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1224] p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#968bf7] bg-[#737bea]/10 border border-[#737bea]/20 px-2.5 py-1 rounded-lg">
                  Tier 1: Daily Free Drop
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    authenticated && canClaimDaily
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {stockKnown && activeDropCount === 0 ? 'Out of Stock' : authenticated && canClaimDaily ? 'Ready to Claim' : 'Unavailable'}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">24-Hour Free Drop</h3>
                <p className="text-xs text-white/55 mt-1 leading-relaxed">
                  Claim one free NFA account per 24 hours when a verified drop is available. No payment or credit card required.
                </p>
              </div>

              {/* Countdown or Status */}
              {!authenticated ? (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/50 font-semibold">
                  Sign in to check available free drops.
                </div>
              ) : stockKnown && activeDropCount === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-300 font-semibold">
                  No free accounts are in stock yet. Check back after the next drop.
                </div>
              ) : !stockKnown ? (
                <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-300 font-semibold">
                  Free drops are temporarily unavailable. Your sign-in is still active.
                </div>
              ) : !canClaimDaily && dailyRemainingSeconds > 0 ? (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Clock size={15} className="text-amber-400" />
                    <span>Next drop resets in:</span>
                  </div>
                  <div className="font-mono text-base font-extrabold text-white tabular-nums tracking-wider">
                    {timeFormatted.hours}:{timeFormatted.minutes}:{timeFormatted.seconds}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 size={16} />
                  <span>Your daily drop is ready! Click below to claim instantly.</span>
                </div>
              )}
            </div>

            <div>
              {loading ? (
                <button disabled className="w-full py-3.5 rounded-xl bg-white/5 text-white/40 text-xs font-bold uppercase">
                  Checking your session…
                </button>
              ) : !authenticated ? (
                <button
                  onClick={handleDiscordLogin}
                  className="w-full py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Login with Discord to Claim</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  disabled={!canClaimDaily || claiming}
                  onClick={() => handleClaim('DAILY')}
                  className="w-full py-3.5 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] disabled:bg-white/5 disabled:text-white/30 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {claiming ? (
                    <span>Generating Credentials…</span>
                  ) : canClaimDaily ? (
                    <>
                      <Sparkles size={14} />
                      <span>Claim Free Account Now</span>
                    </>
                  ) : (
                    <span>{stockKnown && activeDropCount === 0 ? 'No Free Stock Yet' : !stockKnown ? 'Temporarily Unavailable' : 'Cooldown Active'}</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Sponsor Unlock Bonus Drops */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1224] p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#968bf7] bg-[#737bea]/10 border border-[#737bea]/20 px-2.5 py-1 rounded-lg">
                  Tier 2: Bonus Sponsor Drops
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-purple-500/15 border-purple-500/30 text-purple-300">
                  {adClaimsRemaining} / {adClaimsMax} Daily Unlocks Left
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">Sponsor Bonus Drops</h3>
                <p className="text-xs text-white/55 mt-1 leading-relaxed">
                  Support Ghost Alts by visiting a sponsor link. Each completed visit immediately unlocks an extra free Minecraft account (max 3/day).
                </p>
              </div>

              {/* Progress Bar */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Daily Unlocks Used:</span>
                  <span className="font-mono font-bold text-white">
                    {adClaimsToday} of {adClaimsMax}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#737bea] to-[#968bf7] rounded-full transition-all duration-300"
                    style={{ width: `${(adClaimsToday / adClaimsMax) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              {loading ? (
                <button disabled className="w-full py-3.5 rounded-xl bg-white/5 text-white/40 text-xs font-bold uppercase">
                  Checking your session…
                </button>
              ) : !authenticated ? (
                <button
                  onClick={handleDiscordLogin}
                  className="w-full py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Login with Discord to Unlock</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  disabled={!canClaimAd || claiming}
                  onClick={startAdFlow}
                  className="w-full py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 disabled:opacity-40 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Tv size={14} className="text-[#968bf7]" />
                  <span>
                    {stockKnown && activeDropCount === 0 ? 'No Free Stock Yet' : !stockKnown ? 'Temporarily Unavailable' : adClaimsRemaining > 0 ? 'Watch Sponsor & Unlock Account' : 'Daily Limit Reached'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Claimed Account Vault (Reveals credentials when claimed) */}
        {currentCredentials && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] via-[#0a1224] to-[#0a1224] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Your Claimed Account</h3>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    ● Hypixel Unbanned · Launcher Ready
                  </span>
                </div>
              </div>

              {/* Format Tab Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
                {(['combo', 'token', 'full'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      activeTab === tab
                        ? 'bg-white/15 text-white'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {tab === 'combo' ? 'User:Pass' : tab === 'token' ? 'Token' : 'Full Data'}
                  </button>
                ))}
              </div>
            </div>

            {/* Credential Data Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                      {activeTab === 'combo'
                        ? 'Account Combo'
                        : activeTab === 'token'
                        ? 'Launcher Token'
                        : 'Complete Account Output'}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          activeTab === 'token'
                            ? currentToken || currentCredentials
                            : currentCredentials,
                          activeTab
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                    >
                      {copiedKey === activeTab ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="font-mono text-sm text-emerald-300 break-all select-all pt-1">
                    {activeTab === 'token'
                      ? currentToken || 'Token included in launcher payload'
                      : currentCredentials}
                  </div>
                </div>

                <p className="text-xs text-white/45 leading-relaxed">
                  Make sure to save your credentials immediately. NFA accounts are shared access launcher-ready profiles.
                </p>
              </div>

              {/* Skin Avatar Preview */}
              <div className="lg:col-span-4 flex items-center justify-center">
                <div className="h-44 w-36 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center p-2 relative overflow-hidden">
                  <SkinViewer skinUsername={usernameGuess} size="md" mode="bust" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3 Pillar Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="text-[#968bf7] text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-1.5">
              <Zap size={14} className="text-[#737bea]" />
              Instant Delivery
            </div>
            <p className="text-xs text-white/55 leading-relaxed">
              No captchas or email verification codes. Credentials are generated instantly on your screen.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="text-[#968bf7] text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Hypixel Tested
            </div>
            <p className="text-xs text-white/55 leading-relaxed">
              Accounts in our drop pool are unbanned on major competitive servers and ready for gameplay.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="text-[#968bf7] text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-1.5">
              <Gift size={14} className="text-amber-400" />
              100% Free Forever
            </div>
            <p className="text-xs text-white/55 leading-relaxed">
              Supported by community sponsors so players can jump into games without upfront fees.
            </p>
          </div>
        </div>
      </main>

      {/* Sponsor Unlock Modal */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0d0d18] p-6 space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#737bea]/20 border border-[#737bea]/40 flex items-center justify-center mx-auto text-[#968bf7]">
                <Tv size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-white">Sponsor Verification</h3>
              <p className="text-xs text-white/55">
                Visit the sponsor link below. Once the countdown completes, your free Minecraft account will be revealed!
              </p>
            </div>

            <div className="space-y-3">
              {!hasOpenedLinkvertise ? (
                <button
                  onClick={handleOpenLinkvertise}
                  className="w-full py-3.5 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Visit Sponsor Link</span>
                </button>
              ) : adTimer > 0 ? (
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-center space-y-2">
                  <div className="text-2xl font-black text-amber-400 font-mono">{adTimer}s</div>
                  <p className="text-xs text-white/60">Verifying sponsor visit…</p>
                </div>
              ) : (
                <button
                  disabled={claiming}
                  onClick={() => handleClaim('ADS')}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>{claiming ? 'Unlocking…' : 'Claim Verified Account'}</span>
                </button>
              )}

              <button
                onClick={() => setIsAdModalOpen(false)}
                className="w-full py-2.5 rounded-xl text-white/40 hover:text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

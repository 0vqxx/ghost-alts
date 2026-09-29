'use client';

import React, { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import {
  Gift,
  Clock,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Zap,
  Calendar,
  Layers,
  AlertCircle,
  X,
  Play,
  Tv,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface DropItem {
  id: string;
  email: string;
  password: string;
  token?: string | null;
  skinUsername?: string | null;
  status: string; // ACTIVE, QUEUED, CLAIMED, DISABLED
  scheduledFor: string;
  claimedAt?: string | null;
  claimedBy?: { id: string; username: string; email: string } | null;
  claimType?: string | null;
  createdAt: string;
}

export function AdminDropsManager() {
  const [drops, setDrops] = useState<DropItem[]>([]);
  const [claimedDrops, setClaimedDrops] = useState<DropItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [queuedCount, setQueuedCount] = useState(0);
  const [totalClaimedCount, setTotalClaimedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'QUEUED' | 'CLAIMED'>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'single' | 'bulk'>('bulk');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Single form state
  const [singleEmail, setSingleEmail] = useState('');
  const [singlePass, setSinglePass] = useState('');
  const [singleToken, setSingleToken] = useState('');
  const [singleSkin, setSingleSkin] = useState('Steve');
  const [singleScheduleType, setSingleScheduleType] = useState<'instant' | 'scheduled'>('instant');
  const [singleScheduleDate, setSingleScheduleDate] = useState('');

  // Bulk form state
  const [bulkText, setBulkText] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState('30');
  const [startDelayMinutes, setStartDelayMinutes] = useState('0');

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [revealedTokenIds, setRevealedTokenIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDrops = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/drops');
      const data = await res.json();
      if (res.ok) {
        setDrops(data.drops || []);
        setClaimedDrops(data.claimedDrops || []);
        setActiveCount(data.activeCount || 0);
        setQueuedCount(data.queuedCount || 0);
        setTotalClaimedCount(data.totalClaimedCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrops();
  }, []);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTokenReveal = (id: string) => {
    setRevealedTokenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReleaseNow = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/drops?id=${id}&action=release_now`, {
        method: 'PUT',
      });
      if (res.ok) {
        fetchDrops();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account from the drop pool?')) return;
    try {
      const res = await fetch(`/api/admin/drops?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDrops();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let payload: any = {};
      if (importMode === 'single') {
        if (!singleEmail || !singlePass) {
          setError('Email and password are required');
          setSaving(false);
          return;
        }
        payload = {
          mode: 'single',
          singleAccount: {
            email: singleEmail,
            password: singlePass,
            token: singleToken || null,
            skinUsername: singleSkin || 'Steve',
            scheduledFor:
              singleScheduleType === 'scheduled' && singleScheduleDate
                ? new Date(singleScheduleDate).toISOString()
                : new Date().toISOString(),
          },
        };
      } else {
        const lines = bulkText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length === 0) {
          setError('Please paste at least one account combo');
          setSaving(false);
          return;
        }
        payload = {
          mode: 'bulk',
          bulkText,
          scheduleIntervalMinutes: Number(intervalMinutes) || 0,
          startDelayMinutes: Number(startDelayMinutes) || 0,
        };
      }

      const res = await fetch('/api/admin/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule drops');
      }

      setIsModalOpen(false);
      setBulkText('');
      setSingleEmail('');
      setSinglePass('');
      setSingleToken('');
      fetchDrops();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const displayedDrops =
    filter === 'CLAIMED'
      ? claimedDrops
      : filter === 'ALL'
      ? drops
      : drops.filter((d) => d.status === filter);

  const bulkParsedCount = bulkText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm text-white">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#968bf7]" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Free NFA Drops &amp; Release Scheduler
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Configure email, password, and tokens. Queue accounts to release automatically into the public pool.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDrops}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Refresh drops"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Queue / Schedule Drops
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0e121a] border border-white/[0.06] p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Pool (Ready)</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-white/40 font-sans">Available immediately in database</p>
        </div>

        <div className="bg-[#0e121a] border border-white/[0.06] p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] uppercase font-bold tracking-wider">Queued Scheduled Drops</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{queuedCount}</div>
          <p className="text-[11px] text-white/40 font-sans">Auto-unlocking at scheduled intervals</p>
        </div>

        <div className="bg-[#0e121a] border border-white/[0.06] p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Drops Claimed</span>
            <ShieldCheck className="w-4 h-4 text-[#968bf7]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#968bf7]">{totalClaimedCount}</div>
          <p className="text-[11px] text-white/40 font-sans">Claimed via 24h timer and 1-ad bypass</p>
        </div>
      </div>

      {/* Table Navigation Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 bg-[#0e121a] p-1 rounded-xl border border-white/[0.06]">
          {(['ALL', 'ACTIVE', 'QUEUED', 'CLAIMED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-[#5a61e2] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab === 'ALL'
                ? `All Drops (${drops.length})`
                : tab === 'ACTIVE'
                ? `Active (${activeCount})`
                : tab === 'QUEUED'
                ? `Queued (${queuedCount})`
                : `Claimed History (${claimedDrops.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Drops Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#07090e]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.06] text-white/50 uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3 px-4">Email &amp; Password</th>
              <th className="py-3 px-4">Minecraft Token</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Scheduled Release</th>
              <th className="py-3 px-4">Claim Info</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {displayedDrops.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-white/40">
                  {loading ? 'Loading drops from database...' : 'No drops in this category.'}
                </td>
              </tr>
            ) : (
              displayedDrops.map((drop) => {
                const isRevealed = revealedIds.has(drop.id);
                const isTokenRevealed = revealedTokenIds.has(drop.id);
                const isQueued = drop.status === 'QUEUED';
                const isClaimed = drop.status === 'CLAIMED';

                return (
                  <tr key={drop.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Email & Pass */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{drop.email}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-white/40 font-mono">
                          {isRevealed ? (
                            <span className="text-[#968bf7] font-semibold bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08] select-all">
                              {drop.password}
                            </span>
                          ) : (
                            '••••••••••'
                          )}
                        </span>
                        <button
                          onClick={() => toggleReveal(drop.id)}
                          className="text-white/40 hover:text-white cursor-pointer"
                          title="Toggle password"
                        >
                          {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          onClick={() => copyText(drop.id, `${drop.email}:${drop.password}`)}
                          className="text-white/40 hover:text-[#968bf7] cursor-pointer"
                          title="Copy email:pass"
                        >
                          {copiedId === drop.id ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Token */}
                    <td className="py-3 px-4">
                      {drop.token ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#968bf7] max-w-[140px] truncate">
                            {isTokenRevealed ? drop.token : 'mc_tok_••••••••••••'}
                          </span>
                          <button
                            onClick={() => toggleTokenReveal(drop.id)}
                            className="text-white/40 hover:text-white cursor-pointer"
                            title="Toggle token"
                          >
                            {isTokenRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            onClick={() => copyText(`token-${drop.id}`, drop.token || '')}
                            className="text-white/40 hover:text-[#968bf7] cursor-pointer"
                            title="Copy token"
                          >
                            {copiedId === `token-${drop.id}` ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-white/30 text-[11px]">— No Token —</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                          drop.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                            : drop.status === 'QUEUED'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                            : 'bg-white/[0.04] border border-white/[0.06] text-white/50'
                        }`}
                      >
                        {drop.status}
                      </span>
                    </td>

                    {/* Scheduled For */}
                    <td className="py-3 px-4 text-white/50">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock size={12} className="text-white/40" />
                        <span>{formatDate(drop.scheduledFor)}</span>
                      </div>
                    </td>

                    {/* Claim Info */}
                    <td className="py-3 px-4">
                      {isClaimed ? (
                        <div>
                          <p className="font-semibold text-white">
                            @{drop.claimedBy?.username || 'Buyer'}
                          </p>
                          <span className="text-[10px] text-emerald-400 inline-flex items-center gap-1">
                            {drop.claimType === 'ADS' ? (
                              <>
                                <Tv size={10} /> 1-Ad Unlock
                              </>
                            ) : (
                              <>
                                <Gift size={10} /> 24h Daily Claim
                              </>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/30">— Unclaimed —</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isQueued && (
                          <button
                            onClick={() => handleReleaseNow(drop.id)}
                            className="px-2 py-1 rounded-md bg-[#5a61e2]/20 hover:bg-[#5a61e2] text-[#968bf7] hover:text-white text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1 border border-[#5a61e2]/30"
                            title="Release now to active pool"
                          >
                            <Play size={10} /> Release
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(drop.id)}
                          className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          title="Delete drop"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding / Scheduling Drops */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/[0.1] rounded-2xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#5a61e2]/20 text-[#968bf7] border border-[#5a61e2]/30">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    Configure Free Drops &amp; Release Queue
                  </h3>
                  <p className="text-[11px] text-white/40 font-sans">
                    Schedule automated drops or release immediately into the free claim pool.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-[#07090e] p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setImportMode('bulk')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  importMode === 'bulk'
                    ? 'bg-[#5a61e2] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Bulk Queue (30+ Accounts)
              </button>
              <button
                type="button"
                onClick={() => setImportMode('single')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  importMode === 'single'
                    ? 'bg-[#5a61e2] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Single Account Entry
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {importMode === 'bulk' ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-white/60 uppercase block">
                        Account Combos (<span className="text-[#968bf7]">email:pass</span> or <span className="text-[#968bf7]">email:pass:token</span>)
                      </label>
                      <span className="text-[11px] text-[#968bf7] font-mono">
                        {bulkParsedCount} accounts detected
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={`steve_drop1@gmail.com:Pass123!:mc_token_abc123\nalex_drop2@outlook.com:Pass456#\nmc_player3@proton.me:Secret789!:jwt_auth_tok_xyz`}
                      className="w-full bg-[#07090e] border border-white/[0.08] text-white p-3 rounded-xl focus:outline-none focus:border-[#5a61e2] font-mono text-xs placeholder-white/30 leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#07090e] p-3 rounded-xl border border-white/[0.08]">
                    <div>
                      <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                        Release Interval (Minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1440"
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-white/[0.08] text-white p-2 rounded-lg focus:outline-none focus:border-[#5a61e2]"
                        placeholder="e.g. 45"
                      />
                      <small className="text-white/40 block mt-1 font-sans">
                        Minutes between each account unlocking
                      </small>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                        Initial Release Delay (Minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1440"
                        value={startDelayMinutes}
                        onChange={(e) => setStartDelayMinutes(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-white/[0.08] text-white p-2 rounded-lg focus:outline-none focus:border-[#5a61e2]"
                        placeholder="e.g. 0 (Now)"
                      />
                      <small className="text-white/40 block mt-1 font-sans">
                        Delay before first account releases
                      </small>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        className="w-full bg-[#07090e] border border-white/[0.08] text-white p-2 rounded-lg focus:outline-none focus:border-[#5a61e2]"
                        placeholder="account@domain.com"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">Password</label>
                      <input
                        type="text"
                        required
                        value={singlePass}
                        onChange={(e) => setSinglePass(e.target.value)}
                        className="w-full bg-[#07090e] border border-white/[0.08] text-white p-2 rounded-lg focus:outline-none focus:border-[#5a61e2]"
                        placeholder="Password123!"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">Minecraft Token (Optional)</label>
                    <input
                      type="text"
                      value={singleToken}
                      onChange={(e) => setSingleToken(e.target.value)}
                      className="w-full bg-[#07090e] border border-white/[0.08] text-white p-2 rounded-lg focus:outline-none focus:border-[#5a61e2] font-mono"
                      placeholder="mc_auth_tok_eyJhbGciOi..."
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] disabled:opacity-50 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                >
                  {saving ? 'Queueing Accounts...' : 'Schedule Drops'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Coins,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  RefreshCw,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CryptoSetting {
  id?: string;
  symbol: 'BTC' | 'LTC';
  name: string;
  icon: string;
  address: string;
  enabled: boolean;
  minConfirmations: number;
}

export default function AdminPaymentsPage() {
  const [settings, setSettings] = useState<CryptoSetting[]>([
    {
      symbol: 'LTC',
      name: 'Litecoin',
      icon: 'Ł',
      address: '',
      enabled: true,
      minConfirmations: 1,
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      icon: '₿',
      address: '',
      enabled: true,
      minConfirmations: 1,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/payments/settings');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load settings');
      }
      const data = await res.json();
      if (Array.isArray(data.settings)) {
        setSettings((prev) =>
          prev.map((s) => {
            const found = data.settings.find((item: any) => item.symbol === s.symbol);
            if (found) {
              return {
                ...s,
                id: found.id,
                address: found.address || '',
                enabled: found.enabled ?? true,
                minConfirmations: found.minConfirmations || 1,
              };
            }
            return s;
          })
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching payment settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Basic address validation
    for (const s of settings) {
      if (s.enabled && !s.address.trim()) {
        setError(`Please enter a valid receiving address for ${s.name} (${s.symbol}), or disable it.`);
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/payments/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Cryptocurrency wallet settings updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (symbol: 'BTC' | 'LTC', field: keyof CryptoSetting, value: any) => {
    setSettings((prev) =>
      prev.map((item) => (item.symbol === symbol ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="space-y-5 text-white font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Crypto Wallets
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Configure direct on-chain receiving addresses for Litecoin (LTC) and Bitcoin (BTC).
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {settings.map((item) => {
            const isLtc = item.symbol === 'LTC';
            return (
              <div
                key={item.symbol}
                className={`bg-[#0b0e14] border ${
                  item.enabled ? 'border-white/[0.08]' : 'border-white/[0.04] opacity-60'
                } rounded-2xl p-5 space-y-4 transition-all shadow-sm`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base border ${
                        isLtc
                          ? 'bg-[#345d9d]/15 border-[#345d9d]/30 text-[#4e88e7]'
                          : 'bg-[#f7931a]/15 border-[#f7931a]/30 text-[#f7931a]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white">{item.name}</h2>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-white/50 font-mono">
                          {item.symbol}
                        </span>
                        {item.enabled ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 font-mono">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {isLtc
                          ? 'Fast on-chain confirmations & negligible network fees.'
                          : 'Standard Bitcoin network settlement.'}
                      </p>
                    </div>
                  </div>

                  {/* Enable / Disable Switch */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => updateSetting(item.symbol, 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#5a61e2]"></div>
                    <span className="ml-2.5 text-xs font-medium text-white/60">
                      {item.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Receiving Address Field */}
                  <div className="md:col-span-8 space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50 flex items-center justify-between">
                      <span>Receiving Address</span>
                      {item.address.trim() && (
                        <a
                          href={
                            isLtc
                              ? `https://litecoinspace.org/address/${item.address.trim()}`
                              : `https://mempool.space/address/${item.address.trim()}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#968bf7] hover:underline flex items-center gap-1 font-sans text-[11px] font-normal"
                        >
                          Explorer <ExternalLink size={10} />
                        </a>
                      )}
                    </label>
                    <input
                      type="text"
                      value={item.address}
                      onChange={(e) => updateSetting(item.symbol, 'address', e.target.value)}
                      placeholder={
                        isLtc
                          ? 'e.g. LTC1Q... or L...'
                          : 'e.g. bc1q... or 3... or 1...'
                      }
                      className="w-full bg-black/50 border border-white/[0.08] focus:border-[#737bea]/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none transition-colors"
                      required={item.enabled}
                    />
                  </div>

                  {/* Required Confirmations */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                      Confirmations
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={item.minConfirmations}
                        onChange={(e) =>
                          updateSetting(
                            item.symbol,
                            'minConfirmations',
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-full bg-black/50 border border-white/[0.08] focus:border-[#737bea]/60 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                        required
                      />
                      <span className="text-xs text-white/40 whitespace-nowrap">block(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 bg-[#0b0e14] border border-white/[0.08] rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Lock size={13} className="text-[#968bf7]" />
            <span>Settings apply immediately to customer checkout addresses.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={13} /> Save Wallets
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

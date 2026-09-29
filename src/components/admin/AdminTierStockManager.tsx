'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/utils';
import {
  Key,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  AlertCircle,
  Trash2,
  Copy,
  Check,
  Search,
  Zap,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface InventoryItemDTO {
  id: string;
  productId: string;
  productName: string;
  productType: string;
  edition: string;
  status: string;
  orderNumber: string | null;
  addedAt: string;
  soldAt: string | null;
  maskedCredentials: string;
}

interface ProductDTO {
  id: string;
  name: string;
  type: string;
  edition: string;
  price: number;
}

export function AdminTierStockManager({
  tier,
  initialInventory,
  products,
}: {
  tier: 'NFA' | 'MCFA';
  initialInventory: InventoryItemDTO[];
  products: ProductDTO[];
}) {
  const [inventory, setInventory] = useState(initialInventory);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterProduct, setFilterProduct] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [comboText, setComboText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Set of credential IDs currently unmasked
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const isNFA = tier === 'NFA';
  const tierColor = isNFA ? 'text-[#159975]' : 'text-[#7057e8]';
  const tierBg = isNFA ? 'bg-emerald-50 border-emerald-200' : 'bg-[#f0edff] border-[#7057e8]/30';
  const tierBtn = isNFA ? 'bg-[#159975] hover:bg-[#128263] shadow-emerald-600/20' : 'bg-[#7057e8] hover:bg-[#5f46d6] shadow-purple-600/20';

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyCreds = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this credential key from database?')) return;
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setInventory((prev) => prev.filter((item) => item.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Error deleting item');
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError(`Please select an existing ${tier} product listing.`);
      return;
    }
    setError('');
    setLoading(true);

    try {
      const lines = comboText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setError('Please paste at least one credential combo line.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          combos: lines,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add inventory');
      }

      const formatted = data.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || `${tier} Account`,
        productType: item.product?.type || tier,
        edition: item.product?.edition || 'Java + Bedrock',
        status: item.status,
        orderNumber: null,
        addedAt: item.createdAt,
        soldAt: null,
        maskedCredentials: item.sensitiveCredentialsMasked,
      }));

      setInventory((prev) => [...formatted, ...prev]);
      setIsModalOpen(false);
      setComboText('');
      setSuccessMsg(`Successfully uploaded ${formatted.length} ${tier} account credentials into the database!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filtered = inventory.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterProduct !== 'ALL' && item.productId !== filterProduct) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.productName.toLowerCase().includes(q);
      const matchCreds = item.maskedCredentials.toLowerCase().includes(q);
      const matchOrder = item.orderNumber?.toLowerCase().includes(q);
      if (!matchName && !matchCreds && !matchOrder) return false;
    }
    return true;
  });

  const totalCount = inventory.length;
  const availableCount = inventory.filter((i) => i.status === 'AVAILABLE').length;
  const soldCount = inventory.filter((i) => i.status === 'SOLD').length;

  const parsedLineCount = comboText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight uppercase">
              {tier} Stock Vault
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                isNFA
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-[#737bea]/10 border-[#737bea]/20 text-[#968bf7]'
              }`}
            >
              {tier}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            {isNFA
              ? 'Non-Full Access accounts automatically dispatched upon purchase.'
              : 'Full Access accounts with email/master access credentials.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-[#5a61e2] hover:bg-[#6b72e8] transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload {tier} Keys</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 uppercase font-semibold block tracking-wider">
              Available
            </span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{availableCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Key size={15} />
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 uppercase font-semibold block tracking-wider">
              Delivered
            </span>
            <span className="text-xl font-bold text-[#968bf7] font-mono">{soldCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#737bea]/10 text-[#968bf7] flex items-center justify-center">
            <CheckCircle2 size={15} />
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 uppercase font-semibold block tracking-wider">
              Total Keys
            </span>
            <span className="text-xl font-bold text-white font-mono">{totalCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-white/50 flex items-center justify-center">
            <Layers size={15} />
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder={`Search ${tier} stock...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#737bea]/60"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#737bea]/60 cursor-pointer"
        >
          <option value="ALL">All Statuses ({inventory.length})</option>
          <option value="AVAILABLE">Available Only</option>
          <option value="SOLD">Delivered Only</option>
        </select>

        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#737bea]/60 cursor-pointer"
        >
          <option value="ALL">All Products ({products.length})</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (${p.price.toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* Credential Items Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] font-semibold text-white/40 uppercase tracking-wider bg-white/[0.01]">
              <th className="py-2.5 px-3.5">Listing</th>
              <th className="py-2.5 px-3.5">Account Credentials</th>
              <th className="py-2.5 px-3.5">Status</th>
              <th className="py-2.5 px-3.5">Added</th>
              <th className="py-2.5 px-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-white/40 text-xs font-sans">
                  No {tier} stock found matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isRevealed = revealedIds.has(item.id);
                const isCopied = copiedId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3.5 font-medium text-white">
                      <div className="truncate max-w-[180px] font-semibold">{item.productName}</div>
                      <span className="text-[10px] text-white/40 font-mono font-normal">
                        {item.edition}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 font-mono">
                      <div className="flex items-center gap-2 max-w-sm">
                        <span
                          className={`text-xs block truncate ${
                            isRevealed
                              ? 'text-[#968bf7] select-all font-semibold'
                              : 'text-white/40 filter blur-[4px] select-none'
                          }`}
                        >
                          {item.maskedCredentials}
                        </span>
                        <button
                          onClick={() => toggleReveal(item.id)}
                          className="p-1 hover:text-white text-white/40 cursor-pointer shrink-0 transition-colors"
                          title={isRevealed ? 'Hide' : 'Reveal'}
                        >
                          {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => copyCreds(item.id, item.maskedCredentials)}
                          className="p-1 hover:text-white text-white/40 cursor-pointer shrink-0 transition-colors"
                          title="Copy"
                        >
                          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider ${
                          item.status === 'AVAILABLE'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-white/[0.06] border border-white/10 text-white/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-white/40'
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-white/40 font-mono text-[11px]">
                      {formatDate(item.addedAt)}
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-md hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Key"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* UPLOAD CREDENTIALS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-white/70 flex items-center justify-center">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    Upload {tier} Accounts
                  </h3>
                  <p className="text-[11px] text-white/40 font-sans">
                    Format: user:pass or user:pass:token
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.04] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1.5">
                  Target Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#737bea]/60 cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-white/60 uppercase block">
                    Account Combos (1 per line)
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">
                    Count: <strong className="text-white">{parsedLineCount}</strong>
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={comboText}
                  onChange={(e) => setComboText(e.target.value)}
                  placeholder={
                    isNFA
                      ? 'user1@email.com:pass123\nuser2@email.com:pass456'
                      : 'master@outlook.com:passMCFA123\nowner@gmail.com:passMCFA456'
                  }
                  className="w-full p-3 rounded-xl bg-black/50 border border-white/[0.08] text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#737bea]/60 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.04] text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parsedLineCount === 0 || loading}
                  className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold bg-[#5a61e2] hover:bg-[#6b72e8] transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  <span>{loading ? 'Adding...' : `Add (${parsedLineCount}) Keys`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

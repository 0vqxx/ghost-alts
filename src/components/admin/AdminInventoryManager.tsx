'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/utils';
import {
  Layers,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  AlertCircle,
  Trash2,
  FileText,
  Key,
  Copy,
  Check,
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

export function AdminInventoryManager({
  initialInventory,
  products,
}: {
  initialInventory: InventoryItemDTO[];
  products: { id: string; name: string; type: string; edition: string }[];
}) {
  const [inventory, setInventory] = useState(initialInventory);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterProduct, setFilterProduct] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [comboText, setComboText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

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
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
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
      setError('Please select a target account product.');
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
        setError('Please paste at least one credential combo.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          credentialsList: lines,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add inventory');
      }

      const formatted = data.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Account',
        productType: item.product?.type || 'MCFA',
        edition: item.product?.edition || 'Java + Bedrock',
        status: item.status,
        orderNumber: null,
        addedAt: item.addedAt,
        soldAt: null,
        maskedCredentials: item.sensitiveCredentialsMasked,
      }));

      setInventory((prev) => [...formatted, ...prev]);
      setIsModalOpen(false);
      setComboText('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filtered = inventory.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterProduct !== 'ALL' && item.productId !== filterProduct) return false;
    return true;
  });

  const parsedLineCount = comboText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
      case 'SOLD':
        return 'bg-purple-500/10 border border-purple-500/30 text-purple-400';
      case 'RESERVED':
        return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
      default:
        return 'bg-white/[0.04] border border-white/[0.08] text-white/50';
    }
  };

  return (
    <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Raw Inventory Keys
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-white/50 border border-white/[0.08]">
              {inventory.length} keys in DB
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Global repository of all loaded credentials across MCFA and NFA tiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Keys</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#737bea]/60 cursor-pointer"
        >
          <option value="ALL">All Statuses ({inventory.length})</option>
          <option value="AVAILABLE">Available Only</option>
          <option value="SOLD">Sold Only</option>
        </select>

        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#737bea]/60 cursor-pointer"
        >
          <option value="ALL">All Products ({products.length})</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-white/40 uppercase font-semibold text-[10px] tracking-wider bg-white/[0.01]">
              <th className="py-2.5 px-3.5">ID</th>
              <th className="py-2.5 px-3.5">Product</th>
              <th className="py-2.5 px-3.5">Status</th>
              <th className="py-2.5 px-3.5">Credentials</th>
              <th className="py-2.5 px-3.5">Order</th>
              <th className="py-2.5 px-3.5">Date</th>
              <th className="py-2.5 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-white/40 text-xs">
                  No inventory keys currently stored in database.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isRevealed = revealedIds.has(item.id);
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3.5 text-white/40 font-mono text-[11px]">
                      {item.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-3.5">
                      <p className="font-semibold text-white truncate max-w-[160px]">{item.productName}</p>
                      <p className="text-[10px] text-white/40 font-mono">
                        {item.productType} • {item.edition}
                      </p>
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                          item.status === 'AVAILABLE'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-white/[0.05] border border-white/10 text-white/50'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">
                          {isRevealed ? (
                            <span className="text-[#968bf7] font-semibold select-all">
                              {item.maskedCredentials}
                            </span>
                          ) : (
                            <span className="text-white/30 tracking-widest text-[11px]">••••••••••••</span>
                          )}
                        </span>
                        <button
                          onClick={() => toggleReveal(item.id)}
                          className="p-1 hover:text-white text-white/40 rounded transition-colors cursor-pointer"
                          title={isRevealed ? 'Mask' : 'Reveal'}
                        >
                          {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        {isRevealed && (
                          <button
                            onClick={() => copyCreds(item.id, item.maskedCredentials)}
                            className="p-1 hover:text-white text-white/40 rounded transition-colors cursor-pointer"
                            title="Copy"
                          >
                            {copiedId === item.id ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-white/40 font-mono text-[11px]">
                      {item.orderNumber || '—'}
                    </td>
                    <td className="py-3 px-3.5 text-white/40 text-[11px] font-mono">{formatDate(item.addedAt)}</td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                        title="Delete key"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-white/70 flex items-center justify-center">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">Upload Stock</h3>
                  <p className="text-[11px] text-white/40">
                    Accounts will be added directly into PostgreSQL database.
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

            <form onSubmit={handleAddBatch} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">Target Account</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.08] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-[#737bea]/60 cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type} - {p.edition})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-white/60 uppercase block">
                    Account Combos (email:password)
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">
                    {parsedLineCount} lines
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={comboText}
                  onChange={(e) => setComboText(e.target.value)}
                  placeholder={`steve@hotmail.com:Pass123\nalex@gmail.com:Secret456`}
                  className="w-full bg-black/50 border border-white/[0.08] text-white p-3 rounded-xl focus:outline-none focus:border-[#737bea]/60 font-mono text-xs placeholder:text-white/20 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.04] text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] disabled:opacity-40 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  {loading ? 'Saving...' : `Upload (${parsedLineCount || 0}) Keys`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

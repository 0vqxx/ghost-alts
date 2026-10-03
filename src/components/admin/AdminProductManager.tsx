'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ProductItem } from '@/lib/types';
import { formatPrice, maskIGN } from '@/lib/utils';
import { SkinViewer } from '@/components/minecraft/SkinViewer';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Search,
  CheckCircle2,
  Upload,
  Zap,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

const AVAILABLE_CAPES = [
  'Pancake Cape',
  'Vanilla Cape',
  'Migrator Cape',
  'Cherry Blossom',
  '15th Anniversary',
  'Minecon 2011',
  'Minecon 2012',
  'Minecon 2013',
  'Minecon 2015',
  'Minecon 2016',
  'Twitch Cape',
  'TikTok Cape',
];

function safeJsonArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export function AdminProductManager({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isQuickSellModalOpen, setIsQuickSellModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Blur / Mask IGN state
  const [blurAllNames, setBlurAllNames] = useState(false);

  // Filters for Admin Table
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [hypixelBanFilter, setHypixelBanFilter] = useState('All');
  const [donutBanFilter, setDonutBanFilter] = useState('All');

  // New listings stay private drafts until real inventory is uploaded.
  const [quickName, setQuickName] = useState('');
  const [quickPrice, setQuickPrice] = useState('9.99');
  const [quickType, setQuickType] = useState<'MCFA' | 'NFA'>('MCFA');
  const [quickSkin, setQuickSkin] = useState('Steve');
  const [quickBlurName, setQuickBlurName] = useState(false);
  const [quickBatchText, setQuickBatchText] = useState('');
  const [quickMode, setQuickMode] = useState<'single' | 'batch'>('single');

  // Form fields for Full Single Add / Edit
  const [name, setName] = useState('');
  const [skinUsername, setSkinUsername] = useState('Steve');
  const [blurName, setBlurName] = useState(false);
  const [type, setType] = useState<'MCFA' | 'NFA'>('NFA');
  const [edition, setEdition] = useState<'Java' | 'Bedrock' | 'Java + Bedrock'>('Java + Bedrock');
  const [price, setPrice] = useState('2.99');
  const [comparePrice, setComparePrice] = useState('5.99');
  const [description, setDescription] = useState('');
  const [rank, setRank] = useState('None');

  const [selectedCapes, setSelectedCapes] = useState<string[]>([]);
  const [acceptedCryptos, setAcceptedCryptos] = useState<string[]>(['LTC', 'BTC']);
  const [hypixelBanned, setHypixelBanned] = useState(false);
  const [donutBanned, setDonutBanned] = useState(false);
  const [emailDomain, setEmailDomain] = useState('None (NFA)');
  const [badge, setBadge] = useState('');

  // Bulk Upload State
  const [bulkText, setBulkText] = useState('');
  const [bulkParsed, setBulkParsed] = useState<any[]>([]);

  const openQuickSellModal = () => {
    setQuickName('');
    setQuickPrice('2.99');
    setQuickType('NFA');
    setQuickSkin('Steve');
    setQuickBlurName(false);
    setQuickBatchText('');
    setQuickMode('single');
    setError('');
    setIsQuickSellModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSkinUsername('Steve');
    setBlurName(false);
    setType('NFA');
    setEdition('Java + Bedrock');
    setPrice('2.99');
    setComparePrice('5.99');
    setDescription('');
    setRank('None');

    setSelectedCapes([]);
    setAcceptedCryptos(['LTC']);
    setHypixelBanned(false);
    setDonutBanned(false);
    setEmailDomain('None (NFA)');
    setBadge('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setName(p.name);
    setSkinUsername(p.skinUsername || 'Steve');
    setBlurName(Boolean(p.blurName));
    setType((p.type as 'MCFA' | 'NFA') || 'NFA');
    setEdition((p.edition as any) || 'Java + Bedrock');
    setPrice(String(p.price));
    setComparePrice(p.compareAtPrice ? String(p.compareAtPrice) : '');
    setDescription(p.description || '');
    setRank(p.rank || 'None');

    const capes = Array.isArray(p.capes) ? p.capes : [];
    setSelectedCapes(capes);
    setAcceptedCryptos(Array.isArray(p.acceptedCryptos) && p.acceptedCryptos.length > 0 ? p.acceptedCryptos : ['LTC']);
    setHypixelBanned(Boolean(p.hypixelBanned));
    setDonutBanned(Boolean(p.donutBanned));
    setEmailDomain(p.emailDomain || 'None (NFA)');
    setBadge(p.badge || '');
    setError('');
    setIsModalOpen(true);
  };

  const toggleCape = (cape: string) => {
    if (selectedCapes.includes(cape)) {
      setSelectedCapes(selectedCapes.filter((c) => c !== cape));
    } else {
      setSelectedCapes([...selectedCapes, cape]);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
        );
      }
    } catch {}
  };

  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${prodName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {}
  };

  const handleQuickSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (quickMode === 'single') {
        if (!quickName.trim()) {
          throw new Error('Product name is required');
        }
        const cleanPrice = parseFloat(quickPrice.replace('$', '').trim()) || 9.99;

        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: quickName.trim(),
            type: quickType,
            price: cleanPrice,
            skinUsername: quickSkin.trim() || 'Steve',
            blurName: quickBlurName,
            edition: 'Java + Bedrock',
            description: `Official ${quickType} Minecraft account. Instant digital fulfillment.`,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data?.product) {
          throw new Error(data?.error || 'Failed to list product');
        }

        const formatted = {
          ...data.product,
          features: safeJsonArray(data.product.features),
          includedFeatures: safeJsonArray(data.product.includedFeatures),
          excludedFeatures: safeJsonArray(data.product.excludedFeatures),
          capes: safeJsonArray(data.product.capes),
        };

        setProducts((prev) => [formatted, ...prev]);
        setIsQuickSellModalOpen(false);
        setSuccessMsg(`Draft created for "${quickName}". Upload real stock, then activate it.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        // Parse batch listing drafts; quantity alone must never create stock.
        const chunks = quickBatchText.split(/---|\n\n+/);
        const parsedItems: any[] = [];

        for (const chunk of chunks) {
          const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
          let pName = '';
          let pPrice = 9.99;
          let pType = 'MCFA';
          let pBlur = false;

          for (const line of lines) {
            const lower = line.toLowerCase();
            if (lower.startsWith('product:')) {
              pName = line.replace(/product:/i, '').trim();
            } else if (lower.startsWith('price:')) {
              pPrice = parseFloat(line.replace(/price:/i, '').replace('$', '').trim()) || 9.99;
            } else if (lower.startsWith('type:')) {
              pType = line.replace(/type:/i, '').trim().toUpperCase() === 'NFA' ? 'NFA' : 'MCFA';
            } else if (lower.startsWith('blur:')) {
              pBlur = line.replace(/blur:/i, '').trim().toLowerCase() === 'true';
            }
          }

          if (pName) {
            parsedItems.push({
              name: pName,
              price: pPrice,
              type: pType,
              skinUsername: 'Steve',
              blurName: pBlur,
            });
          }
        }

        if (parsedItems.length === 0) {
          throw new Error('No valid products detected. Use Product: X and Price: $X.');
        }

        const res = await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: parsedItems }),
        });

        const data = await res.json();
        if (!res.ok || !Array.isArray(data?.products)) {
          throw new Error(data?.error || 'Failed to list batch products');
        }

        const formatted = data.products.map((p: any) => ({
          ...p,
          features: safeJsonArray(p.features),
          includedFeatures: safeJsonArray(p.includedFeatures),
          excludedFeatures: safeJsonArray(p.excludedFeatures),
          capes: safeJsonArray(p.capes),
        }));

        setProducts((prev) => [...formatted, ...prev]);
        setIsQuickSellModalOpen(false);
        setSuccessMsg(`Created ${formatted.length} drafts. Upload real stock, then activate them.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Error listing product for sale');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isEdit = Boolean(editingProduct);
    const url = '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      ...(editingProduct ? { id: editingProduct.id } : {}),
      name: name || `${type} • ${skinUsername}`,
      type,
      edition,
      price,
      compareAtPrice: comparePrice || null,
      description,
      badge,
      skinUsername,
      blurName,
      capes: selectedCapes,
      rank: rank === 'None' ? null : rank,
      hypixelBanned,
      donutBanned,
      emailDomain,
      hasEmailAccess: type === 'MCFA',
      acceptedCryptos: JSON.stringify(acceptedCryptos),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data?.product) {
        throw new Error(data?.error || 'Failed to save product');
      }

      if (isEdit) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === data.product.id
              ? {
                  ...p,
                  ...data.product,
                  features: safeJsonArray(data.product.features),
                  includedFeatures: safeJsonArray(data.product.includedFeatures),
                  excludedFeatures: safeJsonArray(data.product.excludedFeatures),
                  capes: safeJsonArray(data.product.capes),
                }
              : p
          )
        );
        setSuccessMsg(`Successfully updated "${data.product.name}"`);
      } else {
        const formatted = {
          ...data.product,
          features: safeJsonArray(data.product.features),
          includedFeatures: safeJsonArray(data.product.includedFeatures),
          excludedFeatures: safeJsonArray(data.product.excludedFeatures),
          capes: safeJsonArray(data.product.capes),
        };
        setProducts((prev) => [formatted, ...prev]);
        setSuccessMsg(`Draft created for "${data.product.name}". Upload real stock, then activate it.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTextParse = (text: string) => {
    setBulkText(text);
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: any[] = [];

    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 4 && ['MCFA', 'NFA'].includes(parts[2].toUpperCase()) && Number(parts[3]) > 0) {
        const ign = parts[0];
        const rank = parts[1] || 'None';
        const type = parts[2].toUpperCase() === 'NFA' ? 'NFA' : 'MCFA';
        const price = Number(parts[3]);
        const capes = parts[4] ? parts[4].split(',').map((c) => c.trim()) : [];
        const donutMoney = parts[5] || '$0';

        parsed.push({
          skinUsername: ign,
          name: `${type} • ${rank !== 'None' ? `[${rank}] • ` : ''}${ign}`,
          type,
          price,
          rank,
          capes,
          donutMoney,
          donutRank: 'Default',
          hypixelBanned: false,
          donutBanned: false,
        });
      }
    }

    setBulkParsed(parsed);
  };

  const handleBulkUploadSubmit = async () => {
    if (bulkParsed.length === 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: bulkParsed }),
      });

      const data = await res.json();
      if (!res.ok || !Array.isArray(data?.products)) {
        throw new Error(data?.error || 'Failed to bulk upload accounts');
      }

      const formatted = data.products.map((p: any) => ({
        ...p,
        features: safeJsonArray(p.features),
        includedFeatures: safeJsonArray(p.includedFeatures),
        excludedFeatures: safeJsonArray(p.excludedFeatures),
        capes: safeJsonArray(p.capes),
      }));

      setProducts((prev) => [...formatted, ...prev]);
      setIsBulkModalOpen(false);
      setBulkText('');
      setBulkParsed([]);
      setSuccessMsg(`Created ${formatted.length} listing drafts. Upload real stock before activation.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error during bulk upload');
    } finally {
      setLoading(false);
    }
  };

  // Filter products for admin table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (typeFilter !== 'All' && p.type !== typeFilter) return false;
      if (hypixelBanFilter === 'no' && p.hypixelBanned === true) return false;
      if (hypixelBanFilter === 'yes' && p.hypixelBanned !== true) return false;
      if (donutBanFilter === 'no' && p.donutBanned === true) return false;
      if (donutBanFilter === 'yes' && p.donutBanned !== true) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSkin = (p.skinUsername || '').toLowerCase().includes(q);
        const matchRank = (p.rank || '').toLowerCase().includes(q);
        if (!matchName && !matchSkin && !matchRank) return false;
      }
      return true;
    });
  }, [products, typeFilter, hypixelBanFilter, donutBanFilter, searchQuery]);

  return (
    <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm text-white">
      {/* Header & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Accounts Catalog</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-white/50 border border-white/[0.08]">
              {products.length} listed
            </span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Manage public store listings, prices, inventory stocks, and skin previews.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Blur Toggle Button */}
          <button
            type="button"
            onClick={() => setBlurAllNames(!blurAllNames)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              blurAllNames
                ? 'bg-[#737bea]/15 border-[#737bea]/30 text-[#968bf7]'
                : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white'
            }`}
            title="Toggle blur on usernames"
          >
            {blurAllNames ? <EyeOff size={13} className="text-[#968bf7]" /> : <Eye size={13} />}
            <span>{blurAllNames ? 'Blurred' : 'Blur Names'}</span>
          </button>

          {/* Quick Sell Button */}
          <button
            onClick={openQuickSellModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Listing</span>
          </button>

          <button
            onClick={() => {
              setError('');
              setIsBulkModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-white/60" />
            <span>Bulk Upload</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0e121a] p-3 rounded-xl border border-white/[0.06]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search accounts or IGNs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#5a61e2] transition-colors"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2] transition-colors cursor-pointer"
        >
          <option value="All">All Tiers (MCFA &amp; NFA)</option>
          <option value="MCFA">Full Access Only (MCFA)</option>
          <option value="NFA">Budget Non-Full Access (NFA)</option>
        </select>

        <select
          value={hypixelBanFilter}
          onChange={(e) => setHypixelBanFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2] transition-colors cursor-pointer"
        >
          <option value="All">Hypixel Ban Status: All</option>
          <option value="no">Hypixel: Unbanned</option>
          <option value="yes">Hypixel: Banned</option>
        </select>

        <select
          value={donutBanFilter}
          onChange={(e) => setDonutBanFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2] transition-colors cursor-pointer"
        >
          <option value="All">DonutSMP Status: All</option>
          <option value="no">DonutSMP: Unbanned</option>
          <option value="yes">DonutSMP: Banned</option>
        </select>
      </div>

      {/* Account Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#07090e]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.06] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              <th className="py-3 px-4">Account / Skin</th>
              <th className="py-3 px-4">Tier</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] text-xs">
            {filteredProducts.map((p) => {
              const displayName = blurAllNames ? maskIGN(p.name) : p.name;
              const displayIGN = blurAllNames ? maskIGN(p.skinUsername || 'Steve') : (p.skinUsername || 'Steve');

              return (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                      <SkinViewer skinUsername={p.skinUsername || 'Steve'} size="sm" mode="bust" />
                    </div>
                    <div>
                      <span className={`font-semibold text-white block truncate max-w-[220px] transition-all ${
                        blurAllNames ? 'filter blur-[3px] select-none hover:blur-none' : ''
                      }`}>
                        {displayName}
                      </span>
                      <span className={`text-[10px] text-white/40 font-mono block transition-all ${
                        blurAllNames ? 'filter blur-[2px] select-none hover:blur-none' : ''
                      }`}>
                        IGN: {displayIGN}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                        p.type === 'MCFA'
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {p.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold font-mono text-xs">
                      {p.stockCount > 0 ? (
                        <span className="text-emerald-400">{p.stockCount} in stock</span>
                      ) : (
                        <span className="text-rose-400">Sold out</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-white">
                    ${p.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(p.id, p.active)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                        p.active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-emerald-400' : 'bg-white/30'}`} />
                      <span>{p.active ? 'Active' : 'Hidden'}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QUICK SELL MODAL */}
      {isQuickSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/[0.1] rounded-2xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    Create Listing Draft
                  </h3>
                  <p className="text-[11px] text-white/40">
                    Listings stay hidden until real account credentials are uploaded and you activate them.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickSellModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.06] cursor-pointer"
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

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-[#07090e] rounded-xl border border-white/[0.08] text-xs">
              <button
                type="button"
                onClick={() => setQuickMode('single')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  quickMode === 'single' ? 'bg-[#5a61e2] text-white shadow-sm' : 'text-white/60 hover:text-white'
                }`}
              >
                Single Item Form
              </button>
              <button
                type="button"
                onClick={() => setQuickMode('batch')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  quickMode === 'batch' ? 'bg-[#5a61e2] text-white shadow-sm' : 'text-white/60 hover:text-white'
                }`}
              >
                Batch Text Lister
              </button>
            </div>

            <form onSubmit={handleQuickSellSubmit} className="space-y-4">
              {quickMode === 'single' ? (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                      Product Name / Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hypixel Ranked MVP+ Account"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#5a61e2]"
                    />
                  </div>

                  <div>
                    <div>
                      <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                        Price ($ USD)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="14.99"
                        value={quickPrice}
                        onChange={(e) => setQuickPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#5a61e2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                        Account Tier
                      </label>
                      <select
                        value={quickType}
                        onChange={(e) => setQuickType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2] cursor-pointer"
                      >
                        <option value="MCFA">Full Access (MCFA)</option>
                        <option value="NFA">Non-Full Access (NFA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                        Minecraft Skin Username
                      </label>
                      <input
                        type="text"
                        placeholder="Steve"
                        value={quickSkin}
                        onChange={(e) => setQuickSkin(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#07090e] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors">
                    <input
                      type="checkbox"
                      checked={quickBlurName}
                      onChange={(e) => setQuickBlurName(e.target.checked)}
                      className="rounded border-white/20 text-[#5a61e2] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">Blur Name / IGN on Marketplace</span>
                      <span className="text-[10px] text-white/40 block">Applies privacy blur to skin username for buyers until revealed</span>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-white/60 uppercase block">
                      Paste Drafts (Product: X, Price: $X)
                    </label>
                  </div>
                  <textarea
                    rows={7}
                    value={quickBatchText}
                    onChange={(e) => setQuickBatchText(e.target.value)}
                    placeholder={`Product: Diamond MCFA\nPrice: $19.99\n---\nProduct: Hypixel NFA\nPrice: $2.50`}
                    className="w-full p-3 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#5a61e2] leading-relaxed"
                  />
                  <p className="text-[11px] text-white/40">
                    Separate multiple listings with <code className="text-[#968bf7] font-mono bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">---</code> or empty lines.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setIsQuickSellModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] disabled:opacity-50 text-white text-xs font-medium transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Zap size={14} />
                  <span>{loading ? 'Creating Draft...' : 'Create Draft'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL DETAILED ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/[0.1] rounded-2xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                {editingProduct ? 'Edit Detailed Listing' : 'Add Detailed Account'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCFA • [MVP+] • steve"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                    Skin Username (IGN)
                  </label>
                  <input
                    type="text"
                    required
                    value={skinUsername}
                    onChange={(e) => setSkinUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                    Tier
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2] cursor-pointer"
                  >
                    <option value="MCFA">Full Access (MCFA)</option>
                    <option value="NFA">Non-Full Access (NFA)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                    Price ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#5a61e2]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#07090e] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors">
                <input
                  type="checkbox"
                  checked={blurName}
                  onChange={(e) => setBlurName(e.target.checked)}
                  className="rounded border-white/20 text-[#5a61e2] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Blur Name on Marketplace</span>
                  <span className="text-[10px] text-white/40 block">Applies privacy blur effect to the listing name and skin username</span>
                </div>
              </label>

              <div>
                <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1">
                  Hypixel Rank
                </label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#5a61e2] cursor-pointer"
                >
                  <option value="None">None (Unranked)</option>
                  <option value="VIP">VIP</option>
                  <option value="VIP+">VIP+</option>
                  <option value="MVP">MVP</option>
                  <option value="MVP+">MVP+</option>
                  <option value="MVP++">MVP++</option>
                </select>
              </div>

              {/* Bans & Verification Checkboxes */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.07]">
                <label className="flex items-center gap-2 p-3 rounded-lg bg-[#07090e] border border-white/[0.08] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hypixelBanned}
                    onChange={(e) => setHypixelBanned(e.target.checked)}
                    className="rounded border-white/20 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Hypixel Banned</span>
                    <span className="text-[10px] text-white/40 block">Mark if account has an active Hypixel ban</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-lg bg-[#07090e] border border-white/[0.08] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donutBanned}
                    onChange={(e) => setDonutBanned(e.target.checked)}
                    className="rounded border-white/20 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">DonutSMP Banned</span>
                    <span className="text-[10px] text-white/40 block">Mark if account has an active Donut ban</span>
                  </div>
                </label>
              </div>

              {/* Accepted Cryptocurrencies */}
              <div className="p-3.5 bg-[#07090e] rounded-xl border border-white/[0.08] space-y-2">
                <label className="text-[11px] font-semibold text-white/60 uppercase block">
                  Accepted Cryptocurrencies for this Product
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0b0e14] border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
                    <input
                      type="checkbox"
                      checked={acceptedCryptos.includes('LTC')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAcceptedCryptos(['LTC']);
                        }
                      }}
                      className="rounded border-white/20 text-[#5a61e2] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span className="text-[#4e88e7] font-bold">Ł</span> Litecoin (LTC)
                      </span>
                      <span className="text-[10px] text-white/40">Low-fee on-chain instant settlement</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/60 uppercase block mb-1.5">
                  Capes
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#07090e] rounded-xl border border-white/[0.08]">
                  {AVAILABLE_CAPES.map((cape) => {
                    const isSelected = selectedCapes.includes(cape);
                    return (
                      <button
                        type="button"
                        key={cape}
                        onClick={() => toggleCape(cape)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#5a61e2] text-white shadow-xs'
                            : 'bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white'
                        }`}
                      >
                        {cape}
                      </button>
                    );
                  })}
                </div>
              </div>

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
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] disabled:opacity-50 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update Listing' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/[0.1] rounded-2xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Bulk Upload Accounts
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => handleBulkTextParse(e.target.value)}
              placeholder="Steve:MVP+:MCFA:24.99:Vanilla Cape:$10M&#10;Alex:VIP+:NFA:6.50:Pancake Cape:$0"
              className="w-full p-3 rounded-lg bg-[#07090e] border border-white/[0.08] text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#5a61e2]"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-white/40 font-mono">
                Parsed: <strong className="text-white">{bulkParsed.length}</strong> accounts
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUploadSubmit}
                  disabled={bulkParsed.length === 0 || loading}
                  className="px-4 py-1.5 rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] disabled:opacity-50 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                >
                  {loading ? 'Uploading...' : `Upload (${bulkParsed.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

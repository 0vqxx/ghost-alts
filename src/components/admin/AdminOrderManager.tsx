'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Coins,
  ExternalLink,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface OrderItemDTO {
  productName: string;
  productType: string;
  quantity: number;
  price: number;
}

interface DeliveryDTO {
  id: string;
  credentials: string;
  deliveredAt: string;
}

interface OrderDTO {
  id: string;
  orderNumber: string;
  email: string;
  username: string;
  totalAmount: number;
  subtotal?: number;
  discountAmount?: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
  cryptoCurrency?: string | null;
  cryptoAmountExpected?: number | null;
  cryptoAmountReceived?: number | null;
  receivingAddress?: string | null;
  txHash?: string | null;
  confirmations?: number | null;
  paymentStatus?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  items: OrderItemDTO[];
  deliveries?: DeliveryDTO[];
}

export function AdminOrderManager({ initialOrders }: { initialOrders: OrderDTO[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch {}
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = o.orderNumber.toLowerCase().includes(q);
      const matchEmail = o.email.toLowerCase().includes(q);
      const matchUsername = o.username.toLowerCase().includes(q);
      const matchTx = o.txHash ? o.txHash.toLowerCase().includes(q) : false;
      const matchAddr = o.receivingAddress ? o.receivingAddress.toLowerCase().includes(q) : false;
      return matchNumber || matchEmail || matchUsername || matchTx || matchAddr;
    }
    return true;
  });

  return (
    <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm text-white">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Orders &amp; Sales</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-white/50 border border-white/[0.08]">
              {orders.length} total
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Real-time on-chain transactions, crypto confirmations, and delivered accounts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search ID, email, txid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8.5 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#737bea]/60 outline-none w-full sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/60 border border-white/[0.08] text-xs text-white rounded-lg px-3 py-2 focus:border-[#737bea]/60 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending (Awaiting Crypto)</option>
            <option value="PROCESSING">Processing</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-white/40 uppercase font-semibold text-[10px] tracking-wider bg-white/[0.01]">
              <th className="py-2.5 px-3.5">Order &amp; Method</th>
              <th className="py-2.5 px-3.5">Customer</th>
              <th className="py-2.5 px-3.5">Items</th>
              <th className="py-2.5 px-3.5">Total</th>
              <th className="py-2.5 px-3.5">Status</th>
              <th className="py-2.5 px-3.5">Date</th>
              <th className="py-2.5 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-white/40 text-xs">
                  No orders match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const isCrypto = Boolean(order.cryptoCurrency);
                const isLtc = order.cryptoCurrency === 'LTC';
                return (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-white">{order.orderNumber}</span>
                        {isCrypto && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                              isLtc
                                ? 'bg-[#345d9d]/15 border-[#345d9d]/30 text-[#4e88e7]'
                                : 'bg-[#f7931a]/15 border-[#f7931a]/30 text-[#f7931a]'
                            }`}
                          >
                            {order.cryptoCurrency}
                          </span>
                        )}
                      </div>
                      {isCrypto && order.cryptoAmountExpected && (
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">
                          {order.cryptoAmountExpected} {order.cryptoCurrency}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <p className="font-medium text-white/90">@{order.username}</p>
                      <p className="text-[10px] text-white/40 truncate max-w-[140px]">{order.email}</p>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="space-y-0.5">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-white/80 text-[11px] truncate max-w-[160px]">
                            {item.quantity}x {item.productName}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-white">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider inline-flex items-center gap-1 ${
                          order.status === 'DELIVERED' || order.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : order.status === 'PENDING'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}
                      >
                        {order.status === 'DELIVERED' ? (
                          <CheckCircle2 size={10} />
                        ) : order.status === 'PENDING' ? (
                          <Clock size={10} />
                        ) : (
                          <AlertCircle size={10} />
                        )}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-white/40 text-[11px] font-mono">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={11} /> Details
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="bg-black/60 border border-white/[0.08] text-[10px] text-white/80 rounded-md px-1.5 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="DELIVERED">Delivered</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="REFUNDED">Refunded</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail & Crypto Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/70">
                  <Coins size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-white/40">Crypto payment inspection</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.04] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Crypto Payment Status Card */}
            {selectedOrder.cryptoCurrency ? (
              <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Blockchain Settlement
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                      selectedOrder.paymentStatus === 'paid' || selectedOrder.status === 'DELIVERED'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    }`}
                  >
                    {selectedOrder.paymentStatus || 'awaiting_payment'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 block">Currency</span>
                    <span className="font-bold text-white">{selectedOrder.cryptoCurrency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Expected Crypto</span>
                    <span className="font-bold text-white font-mono">
                      {selectedOrder.cryptoAmountExpected} {selectedOrder.cryptoCurrency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Total USD</span>
                    <span className="font-bold text-white">
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Confirmations</span>
                    <span className="font-bold text-white">
                      {selectedOrder.confirmations || 0} block(s)
                    </span>
                  </div>
                </div>

                {selectedOrder.receivingAddress && (
                  <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] text-white/40 block">Receiving Wallet</span>
                    <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/[0.06] text-[11px] font-mono break-all">
                      <span className="text-white/70">{selectedOrder.receivingAddress}</span>
                      <button
                        onClick={() =>
                          handleCopy(selectedOrder.receivingAddress || '', 'order_addr')
                        }
                        className="p-1 hover:text-white text-white/40 cursor-pointer shrink-0 ml-2"
                      >
                        {copiedKey === 'order_addr' ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.txHash && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-white/40 block">Blockchain Tx Hash</span>
                    <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/[0.06] text-[11px] font-mono break-all">
                      <span className="text-white/70 truncate">{selectedOrder.txHash}</span>
                      <a
                        href={
                          selectedOrder.cryptoCurrency === 'LTC'
                            ? `https://litecoinspace.org/tx/${selectedOrder.txHash}`
                            : `https://mempool.space/tx/${selectedOrder.txHash}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#968bf7] hover:underline flex items-center gap-1 text-[11px] shrink-0 ml-2"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white/60">
                Payment Method: <strong className="text-white">{selectedOrder.paymentMethod}</strong>
              </div>
            )}

            {/* Delivered Credentials */}
            {selectedOrder.deliveries && selectedOrder.deliveries.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block">
                  Fulfilled Credentials ({selectedOrder.deliveries.length})
                </span>
                <div className="space-y-1.5">
                  {selectedOrder.deliveries.map((del, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-black/40 border border-white/[0.06] rounded-lg flex items-center justify-between text-xs"
                    >
                      <code className="text-emerald-400 font-mono text-xs break-all">
                        {del.credentials}
                      </code>
                      <button
                        onClick={() => handleCopy(del.credentials, `del_${idx}`)}
                        className="p-1 hover:text-white text-white/40 cursor-pointer shrink-0 ml-2"
                      >
                        {copiedKey === `del_${idx}` ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer & Timestamp */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/[0.06]">
              <div>
                <span className="text-[10px] text-white/40 block">Customer</span>
                <span className="text-white/80">{selectedOrder.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block">Created At</span>
                <span className="text-white/80">{formatDate(selectedOrder.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

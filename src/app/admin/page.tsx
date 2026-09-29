import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  DollarSign,
  Package,
  CheckCircle2,
  ArrowRight,
  Zap,
  Gift,
  Plus,
  LifeBuoy,
  Layers,
  ShoppingBag,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const [orders, products, users, inventory, drops, tickets] = await Promise.all([
    db.order
      .findMany({
        include: {
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []),
    db.product
      .findMany({
        include: {
          inventoryItems: true,
        },
      })
      .catch(() => []),
    db.user.findMany().catch(() => []),
    db.inventoryItem.findMany().catch(() => []),
    db.freeAccountDrop.findMany().catch(() => []),
    db.supportTicket.findMany({ where: { status: 'OPEN' } }).catch(() => []),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const availableInventory = inventory.filter((i) => i.status === 'AVAILABLE').length;
  const activeDropsCount = drops.filter((d) => d.status === 'ACTIVE').length;
  const queuedDropsCount = drops.filter((d) => d.status === 'QUEUED').length;
  const openTicketsCount = tickets.length;

  let mcfaRevenue = 0;
  let nfaRevenue = 0;

  for (const order of orders) {
    for (const item of order.items) {
      if (item.product?.type === 'MCFA') {
        mcfaRevenue += item.price * item.quantity;
      } else {
        nfaRevenue += item.price * item.quantity;
      }
    }
  }

  const mcfaPercent =
    totalRevenue > 0 ? Math.round((mcfaRevenue / totalRevenue) * 100) : 0;
  const nfaPercent = totalRevenue > 0 ? 100 - mcfaPercent : 0;

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Store Overview
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Real-time sales, live inventory reserves, and active support tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/drops"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5 text-white/60" />
            <span>Drops</span>
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#5a61e2] hover:bg-[#6b72e8] text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Listing</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0b0e14] border border-white/[0.08] rounded-xl p-4.5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[11px] font-medium uppercase tracking-wider">Gross Sales</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white tracking-tight">
            {formatPrice(totalRevenue)}
          </p>
          <p className="text-[11px] text-white/40">Verified crypto orders</p>
        </div>

        <div className="bg-[#0b0e14] border border-white/[0.08] rounded-xl p-4.5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-3.5 h-3.5 text-white/60" />
          </div>
          <p className="text-2xl font-bold font-mono text-white tracking-tight">{totalOrders}</p>
          <p className="text-[11px] text-white/40">Lifetime checkouts</p>
        </div>

        <div className="bg-[#0b0e14] border border-white/[0.08] rounded-xl p-4.5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[11px] font-medium uppercase tracking-wider">In-Stock Accounts</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {availableInventory}
          </p>
          <p className="text-[11px] text-white/40">Ready for instant dispatch</p>
        </div>

        <div className="bg-[#0b0e14] border border-white/[0.08] rounded-xl p-4.5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[11px] font-medium uppercase tracking-wider">Open Disputes</span>
            <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
            {openTicketsCount}
          </p>
          <p className="text-[11px] text-white/40">Awaiting support response</p>
        </div>
      </div>

      {/* MCFA vs NFA Tier Balance */}
      <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Revenue by Account Tier</h3>
            <p className="text-[11px] text-white/40">
              Distribution between Full Access (MCFA) and Non-Full Access (NFA)
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden flex">
            <div
              style={{ width: `${mcfaPercent}%` }}
              className="bg-[#737bea] h-full transition-all duration-300"
            />
            <div
              style={{ width: `${nfaPercent}%` }}
              className="bg-emerald-500/80 h-full transition-all duration-300"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#737bea]" />
              <span>MCFA: <strong>{mcfaPercent}%</strong> ({formatPrice(mcfaRevenue)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              <span>NFA: <strong>{nfaPercent}%</strong> ({formatPrice(nfaRevenue)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Purchases</h3>
            <p className="text-[11px] text-white/40">Latest customer orders and blockchain settlements</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-[#968bf7] hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            <span>All orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/40 uppercase font-semibold text-[10px] tracking-wider bg-white/[0.01]">
                <th className="py-2.5 px-4">Order</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Total</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-white/40 text-xs">
                    No orders recorded in database yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-white/70 truncate max-w-[180px]">{order.email}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[10px] uppercase font-mono">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/40 text-[11px]">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/admin/orders"
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-[11px] font-medium transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

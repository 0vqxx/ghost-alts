import React from 'react';
import Link from 'next/link';
import { db, withDbTimeout } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  Package,
  CheckCircle2,
  Headphones,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default async function DashboardOverviewPage() {
  const user = await requireUser();

  const orders = await withDbTimeout(
    db.order.findMany({
      where: {
        OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
      },
      include: {
        items: { include: { product: true } },
        deliveries: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    [],
    350
  );

  const tickets = await withDbTimeout(
    db.supportTicket.findMany({
      where: { userId: user.id },
    }),
    [],
    350
  );

  const totalOrders = orders.length;
  const completedOrders = orders.filter(
    (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED'
  ).length;
  const activeTickets = tickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
  ).length;
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const recentOrders = orders.slice(0, 4);

  return (
    <div className="space-y-8 font-mono">
      {/* Welcome Banner */}
      <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            Welcome back, {user.username}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Manage your purchases, monitor orders, and access encrypted digital credentials.
          </p>
        </div>

        <Link
          href="/store"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-purple-500/20 self-start sm:self-auto uppercase tracking-wide cursor-pointer"
        >
          Browse Marketplace
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Statistics 4-Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold uppercase">Total Orders</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-primary">{totalOrders}</p>
          <p className="text-[11px] text-secondary/60">Lifetime account orders</p>
        </div>

        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold uppercase">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-primary">{completedOrders}</p>
          <p className="text-[11px] text-secondary/60">Accounts fulfilled</p>
        </div>

        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold uppercase">Active Tickets</span>
            <Headphones className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-primary">{activeTickets}</p>
          <p className="text-[11px] text-secondary/60">In resolution queue</p>
        </div>

        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold uppercase">Total Spent</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{formatPrice(totalSpent)}</p>
          <p className="text-[11px] text-secondary/60">Verified transactions</p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-card-border">
          <div>
            <h3 className="text-base font-bold text-primary">Recent Orders</h3>
            <p className="text-xs text-secondary">Review your latest account purchases</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-xs text-purple-400 hover:text-primary font-semibold flex items-center gap-1 transition-colors"
          >
            View all ({totalOrders}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-secondary bg-soft rounded-2xl border border-card-border">
            No orders placed yet. Choose an account from our catalog to get started.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-card-border bg-surface">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-soft border-b border-card-border text-secondary uppercase font-semibold text-[11px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {recentOrders.map((order) => {
                  const firstItem = order.items[0];
                  return (
                    <tr key={order.id} className="hover:bg-soft transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-primary">
                          {firstItem?.product?.name || 'Minecraft Account'}
                        </div>
                        <div className="text-[11px] text-secondary">
                          {firstItem?.product?.type} • {firstItem?.product?.edition}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-secondary">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-soft hover:bg-white/10 border border-card-border text-xs font-semibold text-primary rounded-lg transition-colors cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          View Purchase
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

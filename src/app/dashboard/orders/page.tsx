import React from 'react';
import Link from 'next/link';
import { db, withDbTimeout } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatPrice, formatDate } from '@/lib/utils';
import { Package, ExternalLink, MessageSquare, Zap, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardOrdersPage() {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'PROCESSING':
      case 'PENDING':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'REFUNDED':
        return 'bg-soft border-card-border text-secondary';
      case 'CANCELLED':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      default:
        return 'bg-soft border-card-border text-secondary';
    }
  };

  return (
    <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm font-mono text-primary">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-card-border">
        <div>
          <h2 className="text-xl font-bold text-primary">Order History</h2>
          <p className="text-xs text-secondary mt-0.5">
            Access credentials, invoices, and dispute resolution for all past orders.
          </p>
        </div>
        <span className="text-xs text-secondary">
          Total: <strong className="text-primary">{orders.length}</strong> orders
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center text-xs text-secondary bg-soft rounded-2xl border border-card-border space-y-3">
          <p className="text-base font-semibold text-primary">No orders found</p>
          <p>You have not placed any account orders yet.</p>
          <Link
            href="/store"
            className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-500/20 uppercase tracking-wide cursor-pointer"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-card-border bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-soft border-b border-card-border text-secondary uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {orders.map((order) => {
                const item = order.items[0];
                return (
                  <tr key={order.id} className="hover:bg-soft transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-primary">
                        {item?.product?.name || 'Minecraft Account'}
                      </p>
                      <p className="text-[11px] text-secondary">
                        {item?.product?.edition}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase border ${
                          item?.product?.type === 'MCFA'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        }`}
                      >
                        {item?.product?.type || 'MCFA'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border font-bold text-[10px] uppercase ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-secondary">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-soft hover:bg-white/10 border border-card-border text-primary font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          View Purchase
                        </Link>
                        <Link
                          href={`/support?orderId=${order.orderNumber}`}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-soft rounded-lg transition-colors cursor-pointer"
                          title="Open ticket for order"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

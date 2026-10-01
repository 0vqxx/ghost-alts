import React from 'react';
import Link from 'next/link';
import { db, withDbTimeout } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { KeyRound, ShieldCheck, Zap, ArrowRight, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPurchasesPage() {
  const user = await requireUser();

  const orders = await withDbTimeout(
    db.order.findMany({
      where: {
        OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
      },
      include: {
        items: { include: { product: true } },
        deliveries: { include: { inventoryItem: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    [],
    350
  );

  const allPurchases = orders.flatMap((o) =>
    o.deliveries.map((d: { id: string; inventoryItem: { product: { name: string; type: string; edition: string } }; deliveredAt: Date; revealedAt: Date | null }) => ({
      deliveryId: d.id,
      orderId: o.id,
      orderNumber: o.orderNumber,
      product: d.inventoryItem.product,
      deliveredAt: d.deliveredAt,
      revealedAt: d.revealedAt,
    }))
  );

  return (
    <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm font-mono text-primary">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-card-border">
        <div>
          <h2 className="text-xl font-bold text-primary">Digital Account Purchases</h2>
          <p className="text-xs text-secondary mt-0.5">
            All Minecraft credentials provisioned to your account.
          </p>
        </div>
        <span className="text-xs text-secondary">
          Total: <strong className="text-purple-400 font-bold">{allPurchases.length}</strong> active deliveries
        </span>
      </div>

      {allPurchases.length === 0 ? (
        <div className="p-12 text-center text-xs text-secondary bg-soft rounded-2xl border border-card-border space-y-3">
          <p className="text-base font-semibold text-primary">No purchases available</p>
          <p>Any accounts purchased will appear in your digital library here.</p>
          <Link
            href="/store"
            className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-500/20 uppercase tracking-wide cursor-pointer"
          >
            Explore Store
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPurchases.map((p) => (
            <div
              key={p.deliveryId}
              className="bg-soft border border-card-border rounded-2xl p-5 space-y-4 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase border ${
                    p.product.type === 'MCFA'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  }`}
                >
                  {p.product.type}
                </span>

                <span className="text-[11px] text-secondary">
                  {p.orderNumber}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-primary">{p.product.name}</h4>
                <p className="text-xs text-secondary mt-0.5">{p.product.edition} Edition</p>
              </div>

              <div className="pt-3 border-t border-card-border flex items-center justify-between text-xs">
                <span className="text-secondary flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> Delivered {formatDate(p.deliveredAt)}
                </span>

                <Link
                  href={`/dashboard/orders/${p.orderId}`}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1 shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Decrypt Vault
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

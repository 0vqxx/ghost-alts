import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CredentialVault } from '@/components/delivery/CredentialVault';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft, Clock, ShieldCheck, Tag, Zap } from 'lucide-react';

interface OrderDeliveryPageProps {
  params: Promise<{ orderId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function OrderDeliveryPage({ params }: OrderDeliveryPageProps) {
  const session = await getSession();
  const { orderId } = await params;

  if (!session) {
    redirect(`/login?redirect=/dashboard/orders/${orderId}`);
  }

  const order = await db.order
    .findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        deliveries: { include: { inventoryItem: { include: { product: true } } } },
      },
    })
    .catch(() => null);

  if (!order) {
    notFound();
  }

  // Strict server-side ownership authorization
  const isOwner =
    order.userId === session.id ||
    order.email.toLowerCase() === session.email.toLowerCase() ||
    session.role === 'ADMIN';

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 font-mono">
        <h2 className="text-xl font-bold text-rose-400">Access Denied</h2>
        <p className="text-xs text-secondary">
          You are not authorized to view the delivery credentials for this order.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-500/20 uppercase cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const formattedDeliveries = order.deliveries.map((d) => ({
    id: d.id,
    productName: d.inventoryItem.product.name,
    productType: d.inventoryItem.product.type,
    edition: d.inventoryItem.product.edition,
    deliveredAt: d.deliveredAt.toISOString(),
    revealedAt: d.revealedAt ? d.revealedAt.toISOString() : null,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-mono text-primary">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-xs text-secondary hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order History
        </Link>
      </div>

      {/* Order Top Summary Card */}
      <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-card-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-secondary">Order</span>
              <span className="text-lg font-mono font-bold text-primary">
                {order.orderNumber}
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Purchased on {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              {order.status}
            </span>
            <span className="text-sm font-bold text-primary">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Deliveries Vault Interface */}
        <CredentialVault
          orderId={order.id}
          orderNumber={order.orderNumber}
          initialDeliveries={formattedDeliveries}
          userEmail={order.email}
        />
      </div>
    </div>
  );
}

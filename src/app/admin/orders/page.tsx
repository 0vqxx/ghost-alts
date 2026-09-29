import React from 'react';
import { db, withDbTimeout } from '@/lib/db';
import { AdminOrderManager } from '@/components/admin/AdminOrderManager';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await withDbTimeout(
    db.order.findMany({
      include: {
        items: { include: { product: true } },
        user: true,
        deliveries: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    [],
    400
  );

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    username: o.user?.username || 'Guest / Unlinked',
    totalAmount: o.totalAmount,
    subtotal: o.subtotal,
    discountAmount: o.discountAmount,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    paymentMethod: o.paymentMethod,
    cryptoCurrency: o.cryptoCurrency,
    cryptoAmountExpected: o.cryptoAmountExpected,
    cryptoAmountReceived: o.cryptoAmountReceived,
    receivingAddress: o.receivingAddress,
    txHash: o.txHash,
    confirmations: o.confirmations,
    paymentStatus: o.paymentStatus,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    expiresAt: o.expiresAt ? o.expiresAt.toISOString() : null,
    items: o.items.map((i) => ({
      productName: i.product?.name || 'Minecraft Account',
      productType: i.product?.type || 'MCFA',
      quantity: i.quantity,
      price: i.price,
    })),
    deliveries: o.deliveries.map((d) => ({
      id: d.id,
      credentials: d.inventoryItem.sensitiveCredentialsMasked,
      deliveredAt: d.deliveredAt.toISOString(),
    })),
  }));

  return (
    <div className="space-y-6">
      <AdminOrderManager initialOrders={formattedOrders} />
    </div>
  );
}

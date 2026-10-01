import React from 'react';
import { db, withDbTimeout } from '@/lib/db';
import { AdminOrderManager } from '@/components/admin/AdminOrderManager';

export const dynamic = 'force-dynamic';

type OrderItemSummary = {
  product?: { name?: string | null; type?: string | null } | null;
  quantity: number;
  price: number;
};

type OrderDeliverySummary = {
  id: string;
  inventoryItem: { sensitiveCredentialsMasked: string };
  deliveredAt: Date;
};

type AdminOrderRecord = {
  id: string;
  orderNumber: string;
  email: string;
  user?: { username: string } | null;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  status: string;
  createdAt: Date;
  paymentMethod: string;
  cryptoCurrency: string | null;
  cryptoAmountExpected: number | null;
  cryptoAmountReceived: number | null;
  receivingAddress: string | null;
  txHash: string | null;
  confirmations: number | null;
  paymentStatus: string | null;
  paidAt: Date | null;
  expiresAt: Date | null;
  items: OrderItemSummary[];
  deliveries: OrderDeliverySummary[];
};

export default async function AdminOrdersPage() {
  const orders = await withDbTimeout<AdminOrderRecord[]>(
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
    items: o.items.map((i: OrderItemSummary) => ({
      productName: i.product?.name || 'Minecraft Account',
      productType: i.product?.type || 'MCFA',
      quantity: i.quantity,
      price: i.price,
    })),
    deliveries: o.deliveries.map((d: OrderDeliverySummary) => ({
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

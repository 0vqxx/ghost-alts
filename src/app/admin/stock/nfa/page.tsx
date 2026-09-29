import React from 'react';
import { db } from '@/lib/db';
import { AdminTierStockManager } from '@/components/admin/AdminTierStockManager';

export const dynamic = 'force-dynamic';

export default async function AdminNFAStockPage() {
  const [inventory, products] = await Promise.all([
    db.inventoryItem
      .findMany({
        where: {
          product: {
            type: 'NFA',
          },
        },
        include: {
          product: true,
          order: true,
        },
        orderBy: { addedAt: 'desc' },
        take: 200,
      })
      .catch(() => []),
    db.product
      .findMany({
        where: {
          type: 'NFA',
        },
        select: {
          id: true,
          name: true,
          type: true,
          edition: true,
          price: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []),
  ]);

  const formattedInventory = inventory.map((i) => ({
    id: i.id,
    productId: i.productId,
    productName: i.product?.name || 'NFA Account',
    productType: i.product?.type || 'NFA',
    edition: i.product?.edition || 'Java',
    status: i.status,
    orderNumber: i.order?.orderNumber || null,
    addedAt: i.addedAt.toISOString(),
    soldAt: i.soldAt ? i.soldAt.toISOString() : null,
    maskedCredentials: i.sensitiveCredentialsMasked,
  }));

  return (
    <div className="space-y-6">
      <AdminTierStockManager
        tier="NFA"
        initialInventory={formattedInventory}
        products={products}
      />
    </div>
  );
}

import React from 'react';
import { db } from '@/lib/db';
import { AdminInventoryManager } from '@/components/admin/AdminInventoryManager';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const [inventory, products] = await Promise.all([
    db.inventoryItem
      .findMany({
        include: {
          product: true,
          order: true,
        },
        orderBy: { addedAt: 'desc' },
        take: 100,
      })
      .catch(() => []),
    db.product
      .findMany({
        select: { id: true, name: true, type: true, edition: true },
        where: { active: true },
      })
      .catch(() => []),
  ]);

  const formattedInventory = inventory.map((i) => ({
    id: i.id,
    productId: i.productId,
    productName: i.product?.name || 'Unknown Product',
    productType: i.product?.type || 'MCFA',
    edition: i.product?.edition || 'Java',
    status: i.status,
    orderNumber: i.order?.orderNumber || null,
    addedAt: i.addedAt.toISOString(),
    soldAt: i.soldAt ? i.soldAt.toISOString() : null,
    maskedCredentials: i.sensitiveCredentialsMasked,
  }));

  return (
    <div className="space-y-6">
      <AdminInventoryManager
        initialInventory={formattedInventory}
        products={products}
      />
    </div>
  );
}

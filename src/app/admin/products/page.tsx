import React from 'react';
import { db, withDbTimeout } from '@/lib/db';
import { ProductItem } from '@/lib/types';
import { AdminProductManager } from '@/components/admin/AdminProductManager';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await withDbTimeout(
    db.product.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    [],
    400
  );

  const parsedProducts: ProductItem[] = products.map((p) => ({
    ...p,
    features: JSON.parse(p.features || '[]') as string[],
    includedFeatures: JSON.parse(p.includedFeatures || '[]') as string[],
    excludedFeatures: JSON.parse(p.excludedFeatures || '[]') as string[],
    capes: JSON.parse(p.capes || '[]') as string[],
    acceptedCryptos: JSON.parse(p.acceptedCryptos || '["LTC", "BTC"]') as string[],
  }));

  return (
    <div className="space-y-6">
      <AdminProductManager initialProducts={parsedProducts} />
    </div>
  );
}

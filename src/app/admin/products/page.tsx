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
    3000
  );

  const safeJson = (val: any, fallback: any = []) => {
    if (!val) return fallback;
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const parsedProducts: ProductItem[] = products.map((p) => ({
    ...p,
    features: safeJson(p.features),
    includedFeatures: safeJson(p.includedFeatures),
    excludedFeatures: safeJson(p.excludedFeatures),
    capes: safeJson(p.capes),
    acceptedCryptos: safeJson(p.acceptedCryptos, ['LTC']),
  }));

  return (
    <div className="space-y-6">
      <AdminProductManager initialProducts={parsedProducts} />
    </div>
  );
}

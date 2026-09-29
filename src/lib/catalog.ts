import { db } from './db';
import { ProductItem } from './types';

export function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  try {
    const parsed = JSON.parse(typeof value === 'string' ? value : '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export const FALLBACK_ACCOUNTS: ProductItem[] = [];

// In-memory high-speed cache
let cachedCatalog: ProductItem[] = [];
let lastFetchTime = 0;
let lastErrorTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds
const ERROR_BACKOFF_MS = 15000; // 15 seconds backoff on DB error

export async function getCatalog(forceFresh = false): Promise<ProductItem[]> {
  const now = Date.now();

  // If cached and fresh, return cache instantly
  if (!forceFresh && now - lastFetchTime < CACHE_TTL_MS && cachedCatalog.length > 0) {
    return cachedCatalog;
  }
  if (!forceFresh && now - lastErrorTime < ERROR_BACKOFF_MS && cachedCatalog.length > 0) {
    return cachedCatalog;
  }

  try {
    const products = await db.product.findMany({
      where: { active: true },
      include: {
        inventoryItems: {
          where: { status: 'AVAILABLE' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (products && products.length > 0) {
      const parsed = products.map((p) => ({
        ...p,
        stockCount: p.inventoryItems.length,
        features: stringList(p.features),
        includedFeatures: stringList(p.includedFeatures),
        excludedFeatures: stringList(p.excludedFeatures),
        capes: stringList(p.capes),
        acceptedCryptos: stringList(p.acceptedCryptos),
      })) as ProductItem[];

      cachedCatalog = parsed;
      lastFetchTime = now;
      return parsed;
    }

    cachedCatalog = [];
    lastFetchTime = now;
    return [];
  } catch (error) {
    console.error('Error fetching catalog from database:', error);
    lastErrorTime = now;
    return cachedCatalog;
  }
}

export function invalidateCatalogCache() {
  cachedCatalog = [];
  lastFetchTime = 0;
  lastErrorTime = 0;
}


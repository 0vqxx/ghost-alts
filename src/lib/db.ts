/**
 * Cloudflare-safe Prisma client.
 *
 * PrismaClient must NEVER be imported at module scope on Cloudflare Workers
 * because the query engine starts before env vars are available.
 * This module dynamically imports Prisma only when a DB operation is actually
 * attempted, and silently returns safe fallbacks when DATABASE_URL is absent.
 */

type PrismaModelLike = {
  findMany: (...a: any[]) => Promise<any[]>;
  findUnique: (...a: any[]) => Promise<any | null>;
  findFirst: (...a: any[]) => Promise<any | null>;
  create: (...a: any[]) => Promise<any>;
  createMany: (...a: any[]) => Promise<{ count: number }>;
  update: (...a: any[]) => Promise<any>;
  upsert: (...a: any[]) => Promise<any>;
  delete: (...a: any[]) => Promise<any>;
  count: (...a: any[]) => Promise<number>;
  updateMany: (...a: any[]) => Promise<any>;
  deleteMany: (...a: any[]) => Promise<any>;
  aggregate: (...a: any[]) => Promise<any>;
};

type PrismaLike = Record<string, PrismaModelLike> & {
  $transaction: PrismaModelLike & ((callback: (tx: any) => Promise<any>, options?: any) => Promise<any>);
};

const globalForPrisma = globalThis as unknown as {
  _prismaClient: any | undefined;
  _prismaLoadPromise: Promise<any | null> | undefined;
  _prismaLoadFailed: boolean;
};

// Safe no-op client used when DATABASE_URL is missing or Prisma fails to load
const noopModel = new Proxy(
  {},
  {
    get(_t, method: string) {
      if (method === 'count') return () => Promise.resolve(0);
      if (method === 'createMany') return () => Promise.resolve({ count: 0 });
      if (method === 'findMany') return () => Promise.resolve([]);
      if (method === 'aggregate') return () => Promise.resolve({ _count: 0 });
      return () => Promise.resolve(null);
    },
  }
);

const noopClient = new Proxy(
  {},
  {
    get(_t, _model: string) {
      return noopModel;
    },
  }
);

function loadPrisma(): Promise<any | null> {
  if (globalForPrisma._prismaLoadFailed) return Promise.resolve(null);
  if (globalForPrisma._prismaClient) return Promise.resolve(globalForPrisma._prismaClient);
  if (globalForPrisma._prismaLoadPromise) return globalForPrisma._prismaLoadPromise;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('[db] DATABASE_URL not set — running in no-op DB mode');
    globalForPrisma._prismaLoadFailed = true;
    return Promise.resolve(null);
  }

  // Concurrent page queries must share one pool and one Prisma client.
  globalForPrisma._prismaLoadPromise = (async () => {
    try {
      // Cloudflare Workers need Prisma's JS driver adapter; the default Prisma
      // query engine cannot open PostgreSQL sockets in the Worker runtime.
      const [{ PrismaClient }, { PrismaPg }, { Pool }] = await Promise.all([
        import('@prisma/client'),
        import('@prisma/adapter-pg'),
        import('pg'),
      ]);
      const pool = new Pool({
        connectionString: url,
        max: 1,
        maxUses: 1,
        connectionTimeoutMillis: 2000,
      });
      const adapter = new PrismaPg(pool);
      const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
      globalForPrisma._prismaClient = client;
      return client;
    } catch (err) {
      console.error('[db] Failed to initialize PrismaClient:', err);
      globalForPrisma._prismaLoadFailed = true;
      return null;
    }
  })();
  return globalForPrisma._prismaLoadPromise;
}

// Async proxy — awaits Prisma lazily on each model property access
export const db: PrismaLike = new Proxy({} as PrismaLike, {
  get(_target, model: string) {
    if (model === '$transaction') {
      return async (callback: (tx: any) => Promise<any>, options?: any) => {
        const client = await loadPrisma();
        if (!client) return callback(noopClient);
        return client.$transaction(callback, options);
      };
    }

    return new Proxy(
      {},
      {
        get(_t, method: string) {
          return async (...args: any[]) => {
            const client = await loadPrisma();
            if (!client) {
              // Return safe fallback
              const handler = (noopModel as any)[method];
              return handler ? handler(...args) : Promise.resolve(null);
            }
            try {
              const modelObj = (client as any)[model];
              if (!modelObj || typeof modelObj[method] !== 'function') {
                return method === 'count' ? 0 : method === 'findMany' ? [] : null;
              }
              return await modelObj[method](...args);
            } catch (err) {
              console.error(`[db] ${String(model)}.${String(method)} threw:`, err);
              return method === 'count' ? 0 : method === 'findMany' ? [] : null;
            }
          };
        },
      }
    );
  },
});

/**
 * Executes a database operation with a strict timeout to prevent slow/unreachable DB
 * from lagging pages. Defaults to 3s for Cloudflare Workers (TCP over pooler is slower).
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 3000
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch {
    clearTimeout(timer!);
    return fallback;
  }
}

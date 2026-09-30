import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient | null {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL is not defined in environment variables.');
      return null;
    }
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    globalForPrisma.prisma = client;
    return client;
  } catch (err) {
    console.error('Failed to initialize PrismaClient:', err);
    return null;
  }
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      // Return safe async mock functions so missing DB never crashes the worker
      return new Proxy(
        {},
        {
          get(_t, method) {
            return () => Promise.resolve(method === 'count' ? 0 : method === 'findMany' ? [] : null);
          },
        }
      );
    }
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

/**
 * Executes a database operation with a strict timeout to prevent slow/unreachable DB from lagging pages.
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 500
): Promise<T> {
  let timer: NodeJS.Timeout;
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

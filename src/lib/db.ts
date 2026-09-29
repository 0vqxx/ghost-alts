import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = db;

/**
 * Executes a database operation with a strict timeout to prevent slow/unreachable DB from lagging pages.
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 400
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

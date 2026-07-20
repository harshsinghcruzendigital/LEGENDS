/**
 * Prisma client accessor (docs/05 §Config). Constructed lazily and only when a
 * DATABASE_URL is present, so with no database configured the app never touches
 * Prisma and runs entirely on mock data. Flip the switch by setting DATABASE_URL.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** True when a database is configured. Repositories branch on this. */
export const hasDatabase = Boolean(process.env.DATABASE_URL);

/** Returns a singleton PrismaClient. Only call inside a `hasDatabase` branch. */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

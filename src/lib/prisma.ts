import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("WARNING: DATABASE_URL is not set in environment variables. Prisma Client cannot connect.");
    // Fallback to empty Prisma client instance to avoid import crashes during build
    return new PrismaClient();
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };

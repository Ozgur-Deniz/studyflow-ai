import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prismaClientSingleton = () => {
  // Get URL from .env file
  const connectionString = `${process.env.DATABASE_URL}`;

  // Create Prisma Neon adapter (takes config object directly in v7)
  const adapter = new PrismaNeon({ connectionString });

  // Initialize Prisma with this new adapter
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

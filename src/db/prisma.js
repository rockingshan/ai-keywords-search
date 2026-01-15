import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

/**
 * Prisma Client Singleton
 * Prevents multiple instances in development with hot reload
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Use global to prevent multiple instances in development
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

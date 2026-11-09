import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let dbUrl = process.env.DATABASE_URL || 'file:../database/kisanconnect.db';

// In Vercel serverless environment (AWS Lambda), filesystem is read-only except /tmp
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/kisanconnect.db';
  if (!fs.existsSync(tmpDbPath)) {
    const candidates = [
      path.resolve(process.cwd(), 'database/kisanconnect.db'),
      path.resolve(process.cwd(), 'backend/database/kisanconnect.db'),
      path.resolve(__dirname, '../../database/kisanconnect.db'),
      path.resolve(__dirname, '../database/kisanconnect.db'),
      path.resolve(__dirname, '../../../database/kisanconnect.db'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          fs.copyFileSync(p, tmpDbPath);
          console.log(`[Prisma] Successfully initialized SQLite database from ${p} to ${tmpDbPath}`);
          break;
        } catch (e) {
          console.error('[Prisma] Error copying database:', e);
        }
      }
    }
  }
  dbUrl = `file:${tmpDbPath}`;
  process.env.DATABASE_URL = dbUrl;
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

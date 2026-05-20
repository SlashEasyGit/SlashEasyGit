import { Injectable, type OnModuleDestroy, type OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@tcharts/db';

/**
 * NestJS-managed Prisma client.
 *
 * In Sprint 4+ this service will own the RLS context binding for the
 * request-scoped transaction (see setRlsContext in @tcharts/db).
 * For Sprint 0, it's just lifecycle management + a readiness probe.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.LOG_LEVEL === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.log.log('Prisma connected');
    } catch (err) {
      this.log.error('Prisma connection failed', err instanceof Error ? err.stack : String(err));
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Readiness probe — `SELECT 1` round trip. */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

import { Injectable, type OnModuleDestroy, type OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

import { env } from '../../config/env';

/**
 * Redis client wrapper.
 *
 * Used by:
 *  - Permission resolution cache (Sprint 3+)
 *  - Idempotency cache (Sprint 4+)
 *  - BullMQ in the worker
 *  - Socket.IO adapter (Sprint 9+)
 *
 * Sprint 0 — exists so health/ready can probe it.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(RedisService.name);
  private client?: Redis;

  async onModuleInit(): Promise<void> {
    this.client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    this.client.on('error', (err) => this.log.error('Redis error', err.message));
    try {
      await this.client.connect();
      this.log.log('Redis connected');
    } catch (err) {
      this.log.error('Redis connection failed', err instanceof Error ? err.message : String(err));
      // Don't throw — Sprint 0 boot should succeed even if Redis isn't up yet.
      // Health probe will report not ready.
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }

  get connection(): Redis {
    if (!this.client) {
      throw new Error('RedisService not initialised');
    }
    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.client?.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}

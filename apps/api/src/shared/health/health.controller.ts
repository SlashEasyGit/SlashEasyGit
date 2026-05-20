import { Controller, Get, HttpCode, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { HealthResponse, ReadyResponse } from '@tcharts/contracts';

import { env } from '../../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller()
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('/health')
  @HttpCode(200)
  health(): HealthResponse {
    return {
      status: 'ok',
      buildSha: env.BUILD_SHA,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  @Get('/ready')
  async ready(@Res() reply: FastifyReply): Promise<void> {
    const [database, redis] = await Promise.all([this.prisma.isHealthy(), this.redis.isHealthy()]);
    const ok = database && redis;
    const body: ReadyResponse = {
      status: ok ? 'ready' : 'not_ready',
      checks: { database, redis },
    };
    reply.status(ok ? 200 : 503).send(body);
  }
}

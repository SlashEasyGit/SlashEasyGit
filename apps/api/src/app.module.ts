import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ErrorsModule } from './shared/errors/errors.module';
import { FeatureFlagModule } from './shared/feature-flag/feature-flag.module';
import { HealthModule } from './shared/health/health.module';
import { LoggerModule } from './shared/logger/logger.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { RequestIdModule } from './shared/middleware/request-id.module';

/**
 * The composition root.
 * Every NestJS module is imported here.
 *
 * Sprint 0 — only the cross-cutting shared modules are wired.
 * Domain modules (auth, company, coa, ...) are wired in their sprints.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), // env validated in env.ts
    EventEmitterModule.forRoot({ wildcard: false, maxListeners: 50 }),
    LoggerModule,
    RequestIdModule,
    ErrorsModule,
    PrismaModule,
    RedisModule,
    FeatureFlagModule,
    HealthModule,
  ],
})
export class AppModule {}

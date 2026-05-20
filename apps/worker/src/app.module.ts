import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';

import { env } from './config/env';

/**
 * Worker app composition.
 *
 * Sprint 0: only the infra plumbing. Real queues + processors land in S4+.
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        transport:
          env.NODE_ENV === 'local'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
      },
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        url: env.REDIS_URL,
      },
    }),
    // BullModule.registerQueue(...) is added per queue as they ship.
  ],
})
export class AppModule {}

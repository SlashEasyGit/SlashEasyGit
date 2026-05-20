import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';

import { RequestIdMiddleware } from './request-id.middleware';

@Module({})
export class RequestIdModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

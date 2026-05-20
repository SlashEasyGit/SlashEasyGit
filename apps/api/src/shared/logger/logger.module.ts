import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { env } from '../../config/env';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        transport:
          env.NODE_ENV === 'local'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'SYS:HH:MM:ss.l',
                  ignore: 'pid,hostname,context,req.headers,res.headers',
                },
              }
            : undefined,
        // Redact anything that should never appear in logs.
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.password_hash',
            'req.body.otp',
            'req.body.refresh_token',
            'req.body.access_token',
            'res.headers["set-cookie"]',
            '*.password',
            '*.passwordHash',
            '*.refreshToken',
            '*.accessToken',
            '*.otp',
          ],
          censor: '[REDACTED]',
        },
        customProps: () => ({
          buildSha: env.BUILD_SHA,
          service: 'tcharts-api',
        }),
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}

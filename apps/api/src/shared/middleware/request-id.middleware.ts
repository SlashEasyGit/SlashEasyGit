import { Injectable, type NestMiddleware } from '@nestjs/common';
import { uuidv7 } from '@tcharts/utils';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Request-ID middleware.
 *
 * If the client sent `X-Request-ID`, accept it (with a length cap). Otherwise generate a UUIDv7.
 * Echo back as `X-Request-ID` and stash on the request object as `req.id` so downstream
 * (logger, error filter) can reference it.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest & { id?: string }, res: FastifyReply['raw'], next: () => void): void {
    const headerVal = req.headers['x-request-id'];
    const incoming = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    const id = incoming && typeof incoming === 'string' && incoming.length <= 128 ? incoming : uuidv7();
    req.id = id;
    res.setHeader('X-Request-ID', id);
    next();
  }
}

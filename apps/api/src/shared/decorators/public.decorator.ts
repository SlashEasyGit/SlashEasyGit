import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as anonymously accessible.
 * The (future, Sprint 1+) AuthGuard checks for this metadata and skips token validation.
 */
export const PUBLIC_KEY = 'tcharts:is_public';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(PUBLIC_KEY, true);

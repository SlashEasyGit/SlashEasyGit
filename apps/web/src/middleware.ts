import { NextResponse, type NextRequest } from 'next/server';

/**
 * Sprint 0 middleware — no-op.
 *
 * Sprint 1+ responsibilities (when auth lands):
 *  - Redirect anonymous users hitting (authed)/* to /login
 *  - Redirect authenticated users hitting (anonymous)/* to /dashboard
 *  - Refresh access token if expired and a valid refresh cookie is present
 *  - Set currentCompanyId cookie when switching companies
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Match nothing in S0; real matcher comes in S1.
  matcher: [],
};

import { redirect } from 'next/navigation';

/**
 * Root entry — redirect to login.
 *
 * Sprint 1 will replace with a session-check: if authed → /companies/...,
 * else → /login.
 */
export default function RootPage() {
  redirect('/login');
}

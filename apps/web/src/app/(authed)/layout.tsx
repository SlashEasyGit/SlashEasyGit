import { AppShell } from '@/components/shell/AppShell';

/**
 * Authed route group layout — the AppShell shell.
 *
 * Sprint 0: no real auth gate yet. The shell renders for anyone who navigates
 * to /dashboard etc. Sprint 1 adds the middleware redirect to /login.
 */
export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

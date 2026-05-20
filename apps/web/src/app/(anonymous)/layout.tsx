/**
 * Anonymous route group layout.
 *
 * Sprint 1 will redirect authenticated users to their dashboard.
 * For Sprint 0 it just renders a centered card surface.
 */
export default function AnonymousLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
      <div className="w-full max-w-md rounded-lg border bg-surface p-8 shadow-sm">{children}</div>
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Sprint 0 placeholder dashboard.
 *
 * Real Company Dashboard ships in Sprint 10 and depends on every module it surfaces.
 */
export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sprint 0 placeholder. The full Company Dashboard ships in Sprint 10.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(['AR', 'AP', 'Net Income', 'Bank Balance'] as const).map((label) => (
          <article
            key={label}
            className="rounded-lg border bg-surface p-4 shadow-sm"
            aria-label={`${label} snapshot`}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </div>
            <div className="money mt-2 text-2xl font-semibold text-foreground">$0.0000</div>
          </article>
        ))}
      </div>
    </section>
  );
}

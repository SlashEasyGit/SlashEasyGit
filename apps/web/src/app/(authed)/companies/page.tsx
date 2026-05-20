import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Companies' };

export default function CompaniesPage() {
  return (
    <section>
      <h1 className="font-display text-2xl font-semibold">Companies</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Company management ships in Sprint 2.
      </p>
    </section>
  );
}

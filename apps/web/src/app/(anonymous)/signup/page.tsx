import type { Metadata } from 'next';

import { SignupForm } from './_components/SignupForm';

export const metadata: Metadata = { title: 'Create account' };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Tcharts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create your workspace account</p>
      </header>
      <SignupForm />
    </div>
  );
}

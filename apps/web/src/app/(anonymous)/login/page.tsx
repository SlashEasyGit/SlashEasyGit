import type { Metadata } from 'next';

import { LoginForm } from './_components/LoginForm';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Tcharts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace</p>
      </header>
      <LoginForm />
    </div>
  );
}

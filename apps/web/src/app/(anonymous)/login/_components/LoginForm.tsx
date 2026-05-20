'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { Button } from '@tcharts/ui/components/button';
import { Input } from '@tcharts/ui/components/input';

interface LoginFields {
  email: string;
  password: string;
}

export function LoginForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>();

  async function onSubmit(_data: LoginFields) {
    setStatus('loading');
    // TODO Sprint 1: replace with real API call
    await new Promise((r) => setTimeout(r, 800));
    setStatus('success');
  }

  if (status === 'success') {
    return (
      <div className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary">
        Signed in successfully.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          error={!!errors.email}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
          })}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <span className="text-xs text-accent hover:underline cursor-pointer">
            Forgot password?
          </span>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          error={!!errors.password}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          })}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={status === 'loading'} className="w-full mt-1">
        {status === 'loading' ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

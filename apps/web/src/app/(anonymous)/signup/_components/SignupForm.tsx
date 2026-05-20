'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { Button } from '@tcharts/ui/components/button';
import { Input } from '@tcharts/ui/components/input';

interface SignupFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignupForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignupFields>();

  async function onSubmit(_data: SignupFields) {
    setStatus('loading');
    // TODO Sprint 1: replace with real API call
    await new Promise((r) => setTimeout(r, 800));
    setStatus('success');
  }

  if (status === 'success') {
    return (
      <div className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary">
        Account created. You can now{' '}
        <Link href="/login" className="font-medium underline">
          sign in
        </Link>
        .
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Full name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          error={!!errors.name}
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          })}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

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
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
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

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          error={!!errors.confirmPassword}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (val) => val === getValues('password') || 'Passwords do not match',
          })}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={status === 'loading'} className="w-full mt-1">
        {status === 'loading' ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

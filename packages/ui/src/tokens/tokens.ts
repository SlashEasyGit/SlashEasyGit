/**
 * Typed token names so TS consumers can pass them to APIs that expect them
 * (e.g., chart libraries) without referencing hex values directly.
 * The CSS custom properties in tokens.css are the runtime source.
 */

export const TOKEN_VARS = {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  surface: 'hsl(var(--surface))',
  surfaceMuted: 'hsl(var(--surface-muted))',
  surfaceRaised: 'hsl(var(--surface-raised))',
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',
  accent: 'hsl(var(--accent))',
  accentForeground: 'hsl(var(--accent-foreground))',
  secondary: 'hsl(var(--secondary))',
  secondaryForeground: 'hsl(var(--secondary-foreground))',
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',
  warning: 'hsl(var(--warning))',
  warningForeground: 'hsl(var(--warning-foreground))',
  border: 'hsl(var(--border))',
  borderFocus: 'hsl(var(--border-focus))',
  ring: 'hsl(var(--ring))',
  sidebarBg: 'hsl(var(--sidebar-bg))',
  sidebarFg: 'hsl(var(--sidebar-fg))',
  sidebarFgMuted: 'hsl(var(--sidebar-fg-muted))',
  sidebarActiveBg: 'hsl(var(--sidebar-active-bg))',
} as const;

export type TokenName = keyof typeof TOKEN_VARS;

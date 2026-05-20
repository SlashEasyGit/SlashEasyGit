'use client';

import { Bell, ChevronDown } from 'lucide-react';

/**
 * Topbar — sticky header above the content area.
 *
 * Sprint 0: brand identity placeholder + notification bell stub.
 * Sprint 2: real Company Switcher.
 * Sprint 9: real notification bell wired to Right Panel.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-surface/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border bg-surface px-3 py-1.5 text-sm hover:bg-surface-muted"
          aria-label="Switch company"
        >
          <span className="font-medium">Demo Company</span>
          <ChevronDown aria-hidden className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-muted"
        >
          <Bell aria-hidden className="h-4 w-4 text-foreground" />
        </button>
        <div
          aria-hidden
          className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
        >
          TC
        </div>
      </div>
    </header>
  );
}

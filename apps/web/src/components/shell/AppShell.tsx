'use client';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { RightPanel } from './RightPanel';
import { useSidebarStore } from '@/stores/sidebar.store';
import { cn } from '@tcharts/ui';

/**
 * AppShell — three-pane layout per DESIGN_SYSTEM.md §4.
 *
 * Layout:
 *   ┌──────────────┬──────────────────────────┬──────────┐
 *   │              │         Topbar           │          │
 *   │              ├──────────────────────────┤          │
 *   │   Sidebar    │                          │  Right   │
 *   │ (expanded /  │        Content           │  Panel   │
 *   │  icon /      │                          │  (S9+)   │
 *   │  hidden)     │                          │          │
 *   └──────────────┴──────────────────────────┴──────────┘
 *
 * Sprint 0: sidebar is rendered; right panel is hidden until S9.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarState = useSidebarStore((s) => s.state);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-[margin] duration-200',
          sidebarState === 'expanded' && 'ml-60',
          sidebarState === 'icon' && 'ml-16',
          sidebarState === 'hidden' && 'ml-0',
        )}
      >
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <RightPanel />
    </div>
  );
}

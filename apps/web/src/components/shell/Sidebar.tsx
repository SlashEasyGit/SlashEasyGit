'use client';

import {
  BookOpen,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  Receipt,
  Settings,
  TrendingUp,
  Users2,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@tcharts/ui';

import { useSidebarStore } from '@/stores/sidebar.store';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Sprint 0 nav. Per-module routes flesh out in their sprints.
const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Accounting Hub', href: '/hub', icon: FileText },
  { label: 'Revenue', href: '/revenue', icon: TrendingUp },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'General Ledger', href: '/general-ledger', icon: BookOpen },
  { label: 'Banking', href: '/banking', icon: Landmark },
  { label: 'Reports', href: '/reports', icon: CreditCard },
  { label: 'Chart of Accounts', href: '/coa', icon: Users2 },
];

const SECONDARY_NAV: NavItem[] = [
  { label: 'Companies', href: '/companies', icon: Building2 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const state = useSidebarStore((s) => s.state);
  const cycle = useSidebarStore((s) => s.cycle);
  const pathname = usePathname();

  if (state === 'hidden') {
    // Render only a thin reveal handle.
    return (
      <button
        aria-label="Show sidebar"
        onClick={cycle}
        className="fixed left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-md bg-sidebar-bg p-2 text-sidebar-fg hover:bg-sidebar-active-bg"
      >
        <ChevronsRight aria-hidden className="h-4 w-4" />
      </button>
    );
  }

  const expanded = state === 'expanded';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col bg-sidebar-bg text-sidebar-fg transition-[width] duration-200',
        expanded ? 'w-60' : 'w-16',
      )}
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-white/5 px-4">
        <span
          aria-hidden
          className="grid h-8 w-8 place-items-center rounded-md bg-primary font-display text-base font-bold text-primary-foreground"
        >
          T
        </span>
        {expanded && <span className="font-display text-lg font-semibold">Tcharts</span>}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} expanded={expanded} />
          ))}
        </ul>
      </nav>

      {/* Secondary nav (settings, etc.) at the bottom */}
      <nav className="border-t border-white/5 p-2" aria-label="Secondary">
        <ul className="flex flex-col gap-1">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} expanded={expanded} />
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <button
        aria-label="Cycle sidebar"
        onClick={cycle}
        className="flex items-center justify-center gap-2 border-t border-white/5 py-2 text-sidebar-fg-muted hover:bg-sidebar-active-bg hover:text-sidebar-fg"
      >
        <ChevronsLeft aria-hidden className="h-4 w-4" />
        {expanded && <span className="text-xs">Collapse</span>}
      </button>
    </aside>
  );
}

function NavLink({ item, active, expanded }: { item: NavItem; active: boolean; expanded: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-sidebar-active-bg text-sidebar-fg'
            : 'text-sidebar-fg-muted hover:bg-sidebar-active-bg hover:text-sidebar-fg',
        )}
        aria-current={active ? 'page' : undefined}
        title={!expanded ? item.label : undefined}
      >
        <Icon aria-hidden className="h-4 w-4 shrink-0" />
        {expanded && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/dashboard') return pathname === href;
  return pathname.startsWith(href);
}

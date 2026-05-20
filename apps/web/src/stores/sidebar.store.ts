/**
 * Sidebar state — client-only.
 * Persisted in localStorage under the key `tcharts.shell.sidebar`.
 *
 * Three states per DESIGN_SYSTEM.md §4.3:
 *  - expanded (240px)
 *  - icon (64px)
 *  - hidden (0)
 *
 * Cycle order: expanded → icon → expanded. "hidden" is reachable via a
 * dedicated control (not yet exposed in S0).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarState = 'expanded' | 'icon' | 'hidden';

interface SidebarStore {
  state: SidebarState;
  setState: (s: SidebarState) => void;
  cycle: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      state: 'expanded',
      setState: (state) => set({ state }),
      cycle: () => {
        const current = get().state;
        set({ state: current === 'expanded' ? 'icon' : 'expanded' });
      },
    }),
    { name: 'tcharts.shell.sidebar', version: 1 },
  ),
);

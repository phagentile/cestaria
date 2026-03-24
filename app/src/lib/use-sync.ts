'use client';

import { useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { syncAll, type SyncStatus } from '@/lib/sync';

// ── Global sync state (shared across components) ──────────────────────────
interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  setStatus: (s: SyncStatus) => void;
  setLastSync: (d: Date) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSync: null,
  setStatus: (status) => set({ status }),
  setLastSync: (lastSync) => set({ lastSync }),
}));

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ── Hook: mount in layout, starts auto-sync ───────────────────────────────
export function useSyncEngine() {
  const { setStatus, setLastSync } = useSyncStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runSync = useCallback(async () => {
    await syncAll((s) => {
      setStatus(s);
      if (s === 'online') setLastSync(new Date());
    });
  }, [setStatus, setLastSync]);

  useEffect(() => {
    // Initial sync on mount
    runSync();

    // Periodic sync every 5 min
    timerRef.current = setInterval(runSync, SYNC_INTERVAL_MS);

    // Sync on reconnect
    const handleOnline = () => runSync();
    window.addEventListener('online', handleOnline);

    // Sync when tab becomes visible again
    const handleVisible = () => {
      if (document.visibilityState === 'visible') runSync();
    };
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [runSync]);

  return useSyncStore();
}

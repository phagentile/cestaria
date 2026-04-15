/**
 * sync.ts — Bidirectional sync between Supabase (remote) and Dexie (local).
 *
 * Strategy:
 *  - On mount / reconnect: pull all remote data into IndexedDB (upsert by id)
 *  - Every 5 minutes: repeat pull
 *  - On every local write (add/update/delete): push to Supabase immediately if online
 *  - If push fails (offline): mark row as dirty in a pending_sync queue
 *  - On reconnect: flush the pending_sync queue
 *
 * Tables synced (reference/admin data — shared across users):
 *   confederations, federations, clubs, referees, categories,
 *   gameTypes, organizingEntities, users
 *
 * Tables synced (match data — per match):
 *   matches, matchRoster, matchReferees, matchEvents,
 *   disciplinaryClocks, medicalClocks, penaltyShootout, auditLog
 */

import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// ── Table map: Dexie table name → Supabase table name ──────────────────────
const ADMIN_TABLES = [
  { local: 'confederations',    remote: 'confederations' },
  { local: 'federations',       remote: 'federations' },
  { local: 'clubs',             remote: 'clubs' },
  { local: 'referees',          remote: 'referees' },
  { local: 'categories',        remote: 'categories' },
  { local: 'gameTypes',         remote: 'game_types' },
  { local: 'organizingEntities',remote: 'organizing_entities' },
  { local: 'users',             remote: 'users' },
] as const;

const MATCH_TABLES = [
  { local: 'matches',           remote: 'matches' },
  { local: 'matchRoster',       remote: 'match_roster' },
  { local: 'matchReferees',     remote: 'match_referees' },
  { local: 'matchEvents',       remote: 'match_events' },
  { local: 'disciplinaryClocks',remote: 'disciplinary_clocks' },
  { local: 'medicalClocks',     remote: 'medical_clocks' },
  { local: 'penaltyShootout',      remote: 'penalty_shootout' },
  { local: 'auditLog',             remote: 'audit_log' },
  { local: 'matchZoneOfficials',   remote: 'match_zone_officials' },
] as const;

export type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline' | 'error';

// ── Connectivity check ──────────────────────────────────────────────────────
export async function isOnline(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const { error } = await supabase.from('clubs').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ── Pull: remote → local (upsert) ──────────────────────────────────────────
async function pullTable(localName: string, remoteName: string) {
  const { data, error } = await supabase.from(remoteName).select('*');
  if (error || !data) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (db as any)[localName];
  if (!table) return;

  await table.bulkPut(data);
}

export async function pullAll(): Promise<void> {
  for (const t of ADMIN_TABLES) {
    await pullTable(t.local, t.remote);
  }
  for (const t of MATCH_TABLES) {
    await pullTable(t.local, t.remote);
  }
}

// ── Push: single row → Supabase ────────────────────────────────────────────
export async function pushRow(
  remoteName: string,
  row: Record<string, unknown>,
  mode: 'upsert' | 'delete' = 'upsert'
): Promise<boolean> {
  try {
    if (mode === 'delete') {
      const { error } = await supabase.from(remoteName).delete().eq('id', row.id);
      return !error;
    }
    const { error } = await supabase.from(remoteName).upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// ── Pending sync queue (stored in localStorage) ────────────────────────────
interface PendingOp {
  remoteName: string;
  row: Record<string, unknown>;
  mode: 'upsert' | 'delete';
  ts: number;
}

const PENDING_KEY = 'rmatch_pending_sync';

function getPending(): PendingOp[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function savePending(ops: PendingOp[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(ops));
}

export function enqueuePush(
  remoteName: string,
  row: Record<string, unknown>,
  mode: 'upsert' | 'delete' = 'upsert'
) {
  const ops = getPending();
  // Deduplicate: remove older op for same id + table
  const filtered = ops.filter(
    (o) => !(o.remoteName === remoteName && o.row.id === row.id)
  );
  filtered.push({ remoteName, row, mode, ts: Date.now() });
  savePending(filtered);
}

export async function flushPending(): Promise<void> {
  const ops = getPending();
  if (ops.length === 0) return;

  const remaining: PendingOp[] = [];
  for (const op of ops) {
    const ok = await pushRow(op.remoteName, op.row, op.mode);
    if (!ok) remaining.push(op);
  }
  savePending(remaining);
}

// ── Main sync function (called on mount + every 5 min) ────────────────────
export async function syncAll(
  onStatus?: (s: SyncStatus) => void
): Promise<void> {
  onStatus?.('syncing');
  const online = await isOnline();
  if (!online) {
    onStatus?.('offline');
    return;
  }
  try {
    await flushPending();
    await pullAll();
    onStatus?.('online');
  } catch {
    onStatus?.('error');
  }
}

// ── Local table → remote name lookup ──────────────────────────────────────
const LOCAL_TO_REMOTE: Record<string, string> = {
  ...Object.fromEntries(ADMIN_TABLES.map((t) => [t.local, t.remote])),
  ...Object.fromEntries(MATCH_TABLES.map((t) => [t.local, t.remote])),
};

export function getRemoteName(localTable: string): string | undefined {
  return LOCAL_TO_REMOTE[localTable];
}

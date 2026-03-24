import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  Match,
  MatchEvent,
  MatchRosterEntry,
  MatchRefereeEntry,
  DisciplinaryClock,
  MedicalClock,
  PenaltyShootoutKick,
  MatchPeriod,
  MatchStatus,
  EventType,
  GameTypeConfig,
  CardType,
  MedicalClockType,
  SubstitutionType,
  ShootoutResult,
  AuditLogEntry,
} from '@/types';
import { EVENT_POINTS, MEDICAL_DURATIONS } from '@/types';
import { db } from '@/lib/db';
import { enqueuePush, pushRow, getRemoteName, isOnline } from '@/lib/sync';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncWrite(localTable: string, row: any, mode: 'upsert' | 'delete' = 'upsert') {
  const remote = getRemoteName(localTable);
  if (!remote) return;
  const online = await isOnline();
  if (online) {
    const ok = await pushRow(remote, row, mode);
    if (!ok) enqueuePush(remote, row, mode);
  } else {
    enqueuePush(remote, row, mode);
  }
}

// Pendências de resolução quando um relógio expira
export type ClockPendingType = 'disciplinary_expired' | 'medical_expired';

export interface ClockPending {
  type: ClockPendingType;
  clockId: string;
  rosterId: string;   // atleta que estava fora
  clubId: string;
  clockSubtype: CardType | MedicalClockType; // 'yellow'|'temp_red' ou 'blood'|'hia'|'blood_hia'
}


interface MatchState {
  // Current match data
  match: Match | null;
  events: MatchEvent[];
  roster: MatchRosterEntry[];
  referees: MatchRefereeEntry[];
  disciplinaryClocks: DisciplinaryClock[];
  medicalClocks: MedicalClock[];
  shootoutKicks: PenaltyShootoutKick[];
  gameConfig: GameTypeConfig | null;

  // Computed
  homeScore: number;
  awayScore: number;

  // Clock resolution pendencies (shown as popups in UI)
  clockPendings: ClockPending[];
  dismissPending: (clockId: string) => void;

  // Match lifecycle
  loadMatch: (matchId: string) => Promise<void>;
  createMatch: (data: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'period' | 'clockSeconds' | 'clockRunning'>) => Promise<string>;
  updateMatch: (updates: Partial<Match>) => Promise<void>;
  confirmMatch: (userId: string) => Promise<void>;
  closeMatch: (userId: string) => Promise<void>;
  reopenMatch: (userId: string) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;

  // Clock
  startClock: () => void;
  pauseClock: () => void;
  setClockSeconds: (seconds: number) => Promise<void>;
  tickClock: (deltaMs: number) => void;

  // Period
  nextPeriod: () => void;

  // Events
  addEvent: (event: Omit<MatchEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  editEvent: (eventId: string, updates: Partial<MatchEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  recalcScores: () => void;

  // Roster
  addRosterEntry: (entry: Omit<MatchRosterEntry, 'id'>) => Promise<string>;
  updateRosterEntry: (id: string, updates: Partial<MatchRosterEntry>) => Promise<void>;
  removeRosterEntry: (id: string) => Promise<void>;

  // Referees
  addReferee: (entry: Omit<MatchRefereeEntry, 'id'>) => Promise<string>;
  removeReferee: (id: string) => Promise<void>;

  // Scoring shortcuts
  addScore: (eventType: EventType, clubId: string, rosterId?: string, metadata?: Record<string, unknown>) => Promise<string>;

  // Cards
  addCard: (clubId: string, rosterId: string, cardType: CardType, reason: string, description?: string) => Promise<void>;

  // Substitutions
  addSubstitution: (clubId: string, outRosterId: string, inRosterId: string, subType: SubstitutionType) => Promise<void>;

  // Medical clocks
  startMedicalClock: (eventId: string, rosterId: string, clubId: string, clockType: MedicalClockType) => Promise<void>;
  // Edit clock remaining time (for manual correction)
  editDisciplinaryClock: (clockId: string, newRemainingSeconds: number) => Promise<void>;
  editMedicalClock: (clockId: string, newRemainingSeconds: number) => Promise<void>;

  // Disciplinary tick (called when game clock ticks)
  tickDisciplinaryClocks: (deltaSeconds: number) => void;
  // Medical tick (called on real time)
  checkMedicalClocks: () => void;

  // Clock resolutions (called from UI popups)
  // Disciplinary: atleta retorna (amarelo) ou é substituído (temp_red → passa inRosterId)
  returnFromCard: (clockId: string, inRosterId?: string) => Promise<void>;
  // Medical: atleta retorna ao campo (returnPlayer=true, inRosterId=undefined)
  //          ou mantém substituição (returnPlayer=false, inRosterId=quem vai entrar se necessário)
  resolveMedical: (clockId: string, keepSubstitution: boolean, inRosterId?: string) => Promise<void>;

  // Shootout
  addShootoutKick: (clubId: string, result: ShootoutResult, rosterId?: string) => Promise<void>;

  // Audit
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => Promise<void>;
}

const PERIOD_ORDER: MatchPeriod[] = [
  'not_started',
  'first_half',
  'half_time',
  'second_half',
  'full_time',
  'extra_time_1',
  'extra_time_break',
  'extra_time_2',
  'penalties',
  'finished',
];

function getStartSeconds(period: MatchPeriod, config: GameTypeConfig | null): number {
  if (!config) return 0;
  switch (period) {
    case 'first_half': return 0;
    case 'second_half': return config.halfDuration * 60;
    case 'extra_time_1': return 0;
    case 'extra_time_2': return config.extraTimeDuration * 60;
    default: return 0;
  }
}

export const useMatchStore = create<MatchState>()((set, get) => ({
  match: null,
  events: [],
  roster: [],
  referees: [],
  disciplinaryClocks: [],
  medicalClocks: [],
  shootoutKicks: [],
  gameConfig: null,
  homeScore: 0,
  awayScore: 0,
  clockPendings: [],

  dismissPending: (clockId: string) => {
    set((state) => ({
      clockPendings: state.clockPendings.filter((p) => p.clockId !== clockId),
    }));
  },

  loadMatch: async (matchId: string) => {
    const match = await db.matches.get(matchId);
    if (!match) return;

    const events = await db.matchEvents.where('matchId').equals(matchId).toArray();
    const roster = await db.matchRoster.where('matchId').equals(matchId).toArray();
    const referees = await db.matchReferees.where('matchId').equals(matchId).toArray();
    const disciplinaryClocks = await db.disciplinaryClocks.where('matchId').equals(matchId).toArray();
    const medicalClocks = await db.medicalClocks.where('matchId').equals(matchId).toArray();
    const shootoutKicks = await db.penaltyShootout.where('matchId').equals(matchId).toArray();

    const gameType = await db.gameTypes.get(match.gameTypeId);
    const gameConfig = gameType?.config ?? null;

    // Calculate scores
    const activeEvents = events.filter(e => !e.deletedAt);
    const homeScore = activeEvents
      .filter(e => e.clubId === match.homeClubId)
      .reduce((sum, e) => sum + (e.points || 0), 0);
    const awayScore = activeEvents
      .filter(e => e.clubId === match.awayClubId)
      .reduce((sum, e) => sum + (e.points || 0), 0);

    set({ match, events, roster, referees, disciplinaryClocks, medicalClocks, shootoutKicks, gameConfig, homeScore, awayScore });
  },

  createMatch: async (data) => {
    const id = uuid();
    const now = new Date().toISOString();
    const match: Match = {
      ...data,
      id,
      status: 'scheduled',
      period: 'not_started',
      clockSeconds: 0,
      clockRunning: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.matches.add(match);
    syncWrite('matches', match);
    return id;
  },

  updateMatch: async (updates) => {
    const { match } = get();
    if (!match) return;
    const updatedMatch = { ...match, ...updates, updatedAt: new Date().toISOString() };
    await db.matches.put(updatedMatch);
    set({ match: updatedMatch });
    syncWrite('matches', updatedMatch);
  },

  confirmMatch: async (userId: string) => {
    const { match, addAuditLog, updateMatch } = get();
    if (!match || match.status !== 'scheduled') return;
    await updateMatch({ status: 'confirmed' });
    await addAuditLog({
      entity: 'match',
      entityId: match.id,
      action: 'confirm',
      field: 'status',
      oldValue: 'scheduled',
      newValue: 'confirmed',
      userId,
    });
  },

  closeMatch: async (userId: string) => {
    const { match, addAuditLog, updateMatch } = get();
    if (!match) return;
    const now = new Date().toISOString();
    await updateMatch({
      status: 'finished',
      period: 'finished',
      clockRunning: false,
      closedAt: now,
      closedBy: userId,
      endTime: now,
    });
    await addAuditLog({
      entity: 'match',
      entityId: match.id,
      action: 'close',
      userId,
    });
  },

  reopenMatch: async (userId: string) => {
    const { match, addAuditLog, updateMatch } = get();
    if (!match) return;
    await updateMatch({
      status: 'reopened',
      period: 'full_time',
      reopenedAt: new Date().toISOString(),
      reopenedBy: userId,
    });
    await addAuditLog({
      entity: 'match',
      entityId: match.id,
      action: 'reopen',
      field: 'closedAt',
      oldValue: match.closedAt,
      userId,
    });
  },

  deleteMatch: async (matchId: string) => {
    await Promise.all([
      db.matches.delete(matchId),
      db.matchEvents.where('matchId').equals(matchId).delete(),
      db.matchRoster.where('matchId').equals(matchId).delete(),
      db.matchReferees.where('matchId').equals(matchId).delete(),
      db.disciplinaryClocks.where('matchId').equals(matchId).delete(),
      db.medicalClocks.where('matchId').equals(matchId).delete(),
      db.penaltyShootout.where('matchId').equals(matchId).delete(),
    ]);
  },

  // Clock
  startClock: () => {
    const { match, updateMatch } = get();
    if (!match || match.status === 'finished') return;
    if (match.period === 'not_started') {
      // Start first half — transition from scheduled/confirmed to live
      updateMatch({
        period: 'first_half',
        status: 'live',
        clockRunning: true,
        clockSeconds: 0,
        startTime: match.startTime || new Date().toISOString(),
      });
    } else {
      updateMatch({ clockRunning: true });
    }
  },

  pauseClock: () => {
    const { updateMatch } = get();
    updateMatch({ clockRunning: false });
  },

  setClockSeconds: async (seconds: number) => {
    const { match } = get();
    if (!match) return;
    const updated = { ...match, clockSeconds: Math.max(0, seconds), updatedAt: new Date().toISOString() };
    await db.matches.put(updated);
    set({ match: updated });
  },

  tickClock: (deltaMs: number) => {
    const { match, disciplinaryClocks, tickDisciplinaryClocks } = get();
    if (!match || !match.clockRunning) return;

    const deltaSec = deltaMs / 1000;
    const newSeconds = match.clockSeconds + deltaSec;

    // Update match clock (no auto-stop, operator controls)
    set((state) => ({
      match: state.match ? { ...state.match, clockSeconds: newSeconds } : null,
    }));

    // Persist periodically (every ~1s)
    if (Math.floor(newSeconds) !== Math.floor(newSeconds - deltaSec)) {
      db.matches.update(match.id, { clockSeconds: newSeconds });
    }

    // Tick disciplinary clocks
    tickDisciplinaryClocks(deltaSec);
  },

  nextPeriod: () => {
    const { match, gameConfig, updateMatch } = get();
    if (!match || !gameConfig) return;

    const currentIdx = PERIOD_ORDER.indexOf(match.period);
    if (currentIdx < 0 || currentIdx >= PERIOD_ORDER.length - 1) return;

    const next = PERIOD_ORDER[currentIdx + 1];
    const startSec = getStartSeconds(next, gameConfig);

    updateMatch({
      period: next,
      clockSeconds: startSec,
      clockRunning: false,
    });
  },

  // Events
  addEvent: async (eventData) => {
    const id = uuid();
    const now = new Date().toISOString();
    const event: MatchEvent = { ...eventData, id, createdAt: now, updatedAt: now };
    await db.matchEvents.add(event);
    set((state) => {
      const events = [...state.events, event];
      return { events };
    });
    syncWrite('matchEvents', event);
    get().recalcScores();
    return id;
  },

  editEvent: async (eventId, updates) => {
    const { events } = get();
    const idx = events.findIndex(e => e.id === eventId);
    if (idx < 0) return;

    const updated = { ...events[idx], ...updates, updatedAt: new Date().toISOString() };
    await db.matchEvents.put(updated);
    syncWrite('matchEvents', updated);

    const newEvents = [...events];
    newEvents[idx] = updated;
    set({ events: newEvents });
    get().recalcScores();
  },

  deleteEvent: async (eventId) => {
    const { events, disciplinaryClocks } = get();
    const idx = events.findIndex(e => e.id === eventId);
    if (idx < 0) return;

    const now = new Date().toISOString();
    const updated = { ...events[idx], deletedAt: now, updatedAt: now };
    await db.matchEvents.put(updated);

    const newEvents = [...events];
    newEvents[idx] = updated;
    set({ events: newEvents });

    // Cancel associated disciplinary clock if it's a card event
    const evt = events[idx];
    if (evt.eventType === 'yellow_card' || evt.eventType === 'temp_red_card') {
      const clock = disciplinaryClocks.find(c => c.eventId === eventId);
      if (clock) {
        const updatedClock = { ...clock, status: 'cancelled' as const };
        await db.disciplinaryClocks.put(updatedClock);
        set((state) => ({
          disciplinaryClocks: state.disciplinaryClocks.map(c =>
            c.id === clock.id ? updatedClock : c
          ),
        }));
      }
    }

    // If it's a substitution_out, revert the player to active
    if (evt.eventType === 'substitution_out' && evt.rosterId) {
      const rosterEntry = get().roster.find(r => r.id === evt.rosterId);
      if (rosterEntry) {
        const updatedEntry = { ...rosterEntry, active: true };
        await db.matchRoster.put(updatedEntry);
        set((state) => ({
          roster: state.roster.map(r => r.id === rosterEntry.id ? updatedEntry : r),
        }));
      }
    }

    get().recalcScores();
  },

  recalcScores: () => {
    const { match, events } = get();
    if (!match) return;

    const activeEvents = events.filter(e => !e.deletedAt);
    const homeScore = activeEvents
      .filter(e => e.clubId === match.homeClubId)
      .reduce((sum, e) => sum + (e.points || 0), 0);
    const awayScore = activeEvents
      .filter(e => e.clubId === match.awayClubId)
      .reduce((sum, e) => sum + (e.points || 0), 0);

    set({ homeScore, awayScore });
  },

  // Roster
  addRosterEntry: async (entry) => {
    const id = uuid();
    const full = { ...entry, id };
    await db.matchRoster.add(full);
    set((state) => ({ roster: [...state.roster, full] }));
    syncWrite('matchRoster', full);
    return id;
  },

  updateRosterEntry: async (id, updates) => {
    const { roster } = get();
    const idx = roster.findIndex(r => r.id === id);
    if (idx < 0) return;
    const updated = { ...roster[idx], ...updates };
    await db.matchRoster.put(updated);
    const newRoster = [...roster];
    newRoster[idx] = updated;
    set({ roster: newRoster });
    syncWrite('matchRoster', updated);
  },

  removeRosterEntry: async (id) => {
    await db.matchRoster.delete(id);
    set((state) => ({ roster: state.roster.filter(r => r.id !== id) }));
    syncWrite('matchRoster', { id }, 'delete');
  },

  // Referees
  addReferee: async (entry) => {
    const id = uuid();
    const full = { ...entry, id };
    await db.matchReferees.add(full);
    set((state) => ({ referees: [...state.referees, full] }));
    syncWrite('matchReferees', full);
    return id;
  },

  removeReferee: async (id) => {
    await db.matchReferees.delete(id);
    set((state) => ({ referees: state.referees.filter(r => r.id !== id) }));
    syncWrite('matchReferees', { id }, 'delete');
  },

  // Scoring
  addScore: async (eventType, clubId, rosterId, metadata) => {
    const { match, addEvent } = get();
    if (!match) return '';
    const points = EVENT_POINTS[eventType] || 0;
    const minute = Math.floor(match.clockSeconds / 60);
    const second = Math.floor(match.clockSeconds % 60);

    return addEvent({
      matchId: match.id,
      clubId,
      rosterId: eventType === 'penalty_try' ? undefined : rosterId,
      eventType,
      minute,
      second,
      period: match.period,
      points,
      metadata,
    });
  },

  // Cards
  addCard: async (clubId, rosterId, cardType, reason, description) => {
    const { match, addEvent } = get();
    if (!match) return;

    const eventType: EventType =
      cardType === 'yellow' ? 'yellow_card' :
      cardType === 'red' ? 'red_card' : 'temp_red_card';

    const minute = Math.floor(match.clockSeconds / 60);
    const second = Math.floor(match.clockSeconds % 60);

    const eventId = await addEvent({
      matchId: match.id,
      clubId,
      rosterId,
      eventType,
      minute,
      second,
      period: match.period,
      points: 0,
      metadata: { reason, description, cardType },
    });

    // Create disciplinary clock for yellow and temp_red
    if (cardType === 'yellow' || cardType === 'temp_red') {
      const { gameConfig } = get();
      if (!gameConfig) return;

      const durationSeconds = cardType === 'yellow'
        ? gameConfig.yellowCardMinutes * 60
        : gameConfig.tempRedCardMinutes * 60;

      const clock: DisciplinaryClock = {
        id: uuid(),
        matchId: match.id,
        eventId,
        rosterId,
        clubId,
        clockType: cardType,
        durationSeconds,
        elapsedGameSeconds: 0,
        status: 'active',
      };

      await db.disciplinaryClocks.add(clock);
      set((state) => ({
        disciplinaryClocks: [...state.disciplinaryClocks, clock],
      }));
    }
  },

  // Substitutions
  addSubstitution: async (clubId, outRosterId, inRosterId, subType) => {
    const { match, addEvent, updateRosterEntry, startMedicalClock } = get();
    if (!match) return;

    const minute = Math.floor(match.clockSeconds / 60);
    const second = Math.floor(match.clockSeconds % 60);
    const metadata = { substitutionType: subType };

    // Event: player out
    const outEventId = await addEvent({
      matchId: match.id,
      clubId,
      rosterId: outRosterId,
      eventType: 'substitution_out',
      minute,
      second,
      period: match.period,
      points: 0,
      metadata,
    });

    // Event: player in
    await addEvent({
      matchId: match.id,
      clubId,
      rosterId: inRosterId,
      eventType: 'substitution_in',
      minute,
      second,
      period: match.period,
      points: 0,
      metadata,
    });

    // Update roster
    await updateRosterEntry(outRosterId, { active: false });
    await updateRosterEntry(inRosterId, { active: true });

    // Start medical clock if applicable
    const medicalTypes: Record<string, MedicalClockType> = {
      blood: 'blood',
      hia: 'hia',
      blood_hia: 'blood_hia',
    };

    const medType = medicalTypes[subType];
    if (medType) {
      await startMedicalClock(outEventId, outRosterId, clubId, medType);
    }
  },

  // Medical clocks
  startMedicalClock: async (eventId, rosterId, clubId, clockType) => {
    const { match } = get();
    if (!match) return;

    const clock: MedicalClock = {
      id: uuid(),
      matchId: match.id,
      eventId,
      rosterId,
      clubId,
      clockType,
      durationSeconds: MEDICAL_DURATIONS[clockType],
      startedAt: new Date().toISOString(),
      status: 'active',
    };

    await db.medicalClocks.add(clock);
    set((state) => ({
      medicalClocks: [...state.medicalClocks, clock],
    }));
  },

  // Edit clock remaining time (operator manual correction)
  editDisciplinaryClock: async (clockId: string, newRemainingSeconds: number) => {
    const { disciplinaryClocks } = get();
    const clock = disciplinaryClocks.find(c => c.id === clockId);
    if (!clock) return;
    const newElapsed = Math.max(0, clock.durationSeconds - newRemainingSeconds);
    const updated = { ...clock, elapsedGameSeconds: newElapsed };
    await db.disciplinaryClocks.put(updated);
    set((state) => ({
      disciplinaryClocks: state.disciplinaryClocks.map(c =>
        c.id === clockId ? updated : c
      ),
    }));
  },

  editMedicalClock: async (clockId: string, newRemainingSeconds: number) => {
    const { medicalClocks } = get();
    const clock = medicalClocks.find(c => c.id === clockId);
    if (!clock) return;
    // Adjust startedAt so that (now - startedAt) / 1000 = durationSeconds - newRemainingSeconds
    const newElapsed = Math.max(0, clock.durationSeconds - newRemainingSeconds);
    const newStartedAt = new Date(Date.now() - newElapsed * 1000).toISOString();
    const updated = { ...clock, startedAt: newStartedAt };
    await db.medicalClocks.put(updated);
    set((state) => ({
      medicalClocks: state.medicalClocks.map(c =>
        c.id === clockId ? updated : c
      ),
    }));
  },

  // Disciplinary tick
  tickDisciplinaryClocks: (deltaSeconds: number) => {
    set((state) => {
      const newPendings: ClockPending[] = [];

      const updated = state.disciplinaryClocks.map(clock => {
        if (clock.status !== 'active') return clock;

        const newElapsed = clock.elapsedGameSeconds + deltaSeconds;
        if (newElapsed >= clock.durationSeconds) {
          const expired = { ...clock, elapsedGameSeconds: clock.durationSeconds, status: 'expired' as const };
          db.disciplinaryClocks.put(expired);

          // Add pending only if not already in list
          const alreadyPending = state.clockPendings.some(p => p.clockId === clock.id);
          if (!alreadyPending) {
            newPendings.push({
              type: 'disciplinary_expired',
              clockId: clock.id,
              rosterId: clock.rosterId,
              clubId: clock.clubId,
              clockSubtype: clock.clockType,
            });
          }

          return expired;
        }
        // Persist every ~5 seconds
        if (Math.floor(newElapsed / 5) !== Math.floor(clock.elapsedGameSeconds / 5)) {
          db.disciplinaryClocks.put({ ...clock, elapsedGameSeconds: newElapsed });
        }
        return { ...clock, elapsedGameSeconds: newElapsed };
      });

      return {
        disciplinaryClocks: updated,
        clockPendings: newPendings.length > 0
          ? [...state.clockPendings, ...newPendings]
          : state.clockPendings,
      };
    });
  },

  // Medical check
  checkMedicalClocks: () => {
    const now = Date.now();
    set((state) => {
      const newPendings: ClockPending[] = [];

      const updated = state.medicalClocks.map(clock => {
        if (clock.status !== 'active') return clock;
        const elapsed = (now - new Date(clock.startedAt).getTime()) / 1000;
        if (elapsed >= clock.durationSeconds) {
          const expired = { ...clock, status: 'expired' as const };
          db.medicalClocks.put(expired);

          // Add pending only if not already in list
          const alreadyPending = state.clockPendings.some(p => p.clockId === clock.id);
          if (!alreadyPending) {
            newPendings.push({
              type: 'medical_expired',
              clockId: clock.id,
              rosterId: clock.rosterId,
              clubId: clock.clubId,
              clockSubtype: clock.clockType,
            });
          }

          return expired;
        }
        return clock;
      });

      return {
        medicalClocks: updated,
        clockPendings: newPendings.length > 0
          ? [...state.clockPendings, ...newPendings]
          : state.clockPendings,
      };
    });
  },

  // ─── Clock Resolutions ───────────────────────────────────────

  // Retorno de cartão disciplinar expirado:
  //   - Amarelo / Temp Red e atleta volta → card_return na timeline, atleta fica ativo
  //   - Temp Red e atleta é substituído → substitution_out + substitution_in (como substituição permanente)
  returnFromCard: async (clockId: string, inRosterId?: string) => {
    const { match, roster, addEvent, updateRosterEntry, dismissPending, disciplinaryClocks } = get();
    if (!match) return;

    const clock = disciplinaryClocks.find(c => c.id === clockId);
    if (!clock) return;

    const outPlayer = roster.find(r => r.id === clock.rosterId);
    const minute = Math.floor(match.clockSeconds / 60);
    const second = Math.floor(match.clockSeconds % 60);
    const baseEvent = { matchId: match.id, clubId: clock.clubId, minute, second, period: match.period, points: 0 };

    if (clock.clockType === 'yellow') {
      // Amarelo: atleta retorna automaticamente
      await updateRosterEntry(clock.rosterId, { active: true });
      await addEvent({
        ...baseEvent,
        rosterId: clock.rosterId,
        eventType: 'card_return',
        metadata: { cardType: 'yellow', playerName: outPlayer?.playerName, shirtNumber: outPlayer?.shirtNumber },
      });
    } else if (clock.clockType === 'temp_red') {
      if (inRosterId) {
        // Vermelho temp: substituição permanente — outPlayer sai, inPlayer entra
        const inPlayer = roster.find(r => r.id === inRosterId);
        await updateRosterEntry(clock.rosterId, { active: false });
        await updateRosterEntry(inRosterId, { active: true });
        await addEvent({
          ...baseEvent,
          rosterId: clock.rosterId,
          eventType: 'substitution_out',
          metadata: { substitutionType: 'temporary', cardType: 'temp_red' },
        });
        await addEvent({
          ...baseEvent,
          rosterId: inRosterId,
          eventType: 'substitution_in',
          metadata: { substitutionType: 'temporary', replacedRosterId: clock.rosterId },
        });
      } else {
        // Sem substituto disponível: retorna ao campo mesmo assim
        await updateRosterEntry(clock.rosterId, { active: true });
        await addEvent({
          ...baseEvent,
          rosterId: clock.rosterId,
          eventType: 'card_return',
          metadata: { cardType: 'temp_red', playerName: outPlayer?.playerName, shirtNumber: outPlayer?.shirtNumber },
        });
      }
    }

    dismissPending(clockId);
  },

  // Resolução de relógio médico expirado:
  //   keepSubstitution=true → substituto fica, outPlayer é eliminado do jogo
  //   keepSubstitution=false → outPlayer retorna ao campo (médico liberou)
  //     - inRosterId: se fornecido, quem saiu temporariamente (outPlayer) entra de volta
  //       e inRosterId (substituto) sai
  resolveMedical: async (clockId: string, keepSubstitution: boolean, inRosterId?: string) => {
    const { match, roster, addEvent, updateRosterEntry, dismissPending, medicalClocks } = get();
    if (!match) return;

    const clock = medicalClocks.find(c => c.id === clockId);
    if (!clock) return;

    const outPlayer = roster.find(r => r.id === clock.rosterId);
    const minute = Math.floor(match.clockSeconds / 60);
    const second = Math.floor(match.clockSeconds % 60);
    const baseEvent = { matchId: match.id, clubId: clock.clubId, minute, second, period: match.period, points: 0 };

    if (keepSubstitution) {
      // Manter substituição por motivo de saúde — outPlayer já está fora, nada muda no campo
      // Apenas registrar evento informativo
      await addEvent({
        ...baseEvent,
        rosterId: clock.rosterId,
        eventType: 'blood_time_end',
        metadata: {
          clockType: clock.clockType,
          kept: true,
          playerName: outPlayer?.playerName,
          shirtNumber: outPlayer?.shirtNumber,
        },
      });
    } else {
      // Atleta liberado: retorna ao campo
      // Se há substituto identificado, ele sai e outPlayer entra de volta
      await updateRosterEntry(clock.rosterId, { active: true });
      await addEvent({
        ...baseEvent,
        rosterId: clock.rosterId,
        eventType: 'medical_return',
        metadata: {
          clockType: clock.clockType,
          playerName: outPlayer?.playerName,
          shirtNumber: outPlayer?.shirtNumber,
          replacedRosterId: inRosterId,
        },
      });

      if (inRosterId) {
        // Substituto temporário sai
        await updateRosterEntry(inRosterId, { active: false });
        const subPlayer = roster.find(r => r.id === inRosterId);
        await addEvent({
          ...baseEvent,
          rosterId: inRosterId,
          eventType: 'substitution_out',
          metadata: {
            substitutionType: clock.clockType,
            replacedBy: clock.rosterId,
            playerName: subPlayer?.playerName,
          },
        });
      }
    }

    dismissPending(clockId);
  },

  // Shootout
  addShootoutKick: async (clubId, result, rosterId) => {
    const { match, shootoutKicks } = get();
    if (!match) return;

    const kick: PenaltyShootoutKick = {
      id: uuid(),
      matchId: match.id,
      round: Math.floor(shootoutKicks.length / 2) + 1,
      clubId,
      rosterId,
      result,
      kickOrder: shootoutKicks.length + 1,
    };

    await db.penaltyShootout.add(kick);
    set((state) => ({
      shootoutKicks: [...state.shootoutKicks, kick],
    }));
  },

  // Audit
  addAuditLog: async (entry) => {
    const full: AuditLogEntry = {
      ...entry,
      id: uuid(),
      timestamp: new Date().toISOString(),
    };
    await db.auditLog.add(full);
  },
}));

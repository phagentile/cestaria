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

  // Match lifecycle
  loadMatch: (matchId: string) => Promise<void>;
  createMatch: (data: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'period' | 'clockSeconds' | 'clockRunning'>) => Promise<string>;
  updateMatch: (updates: Partial<Match>) => Promise<void>;
  confirmMatch: (userId: string) => Promise<void>;
  closeMatch: (userId: string) => Promise<void>;
  reopenMatch: (userId: string) => Promise<void>;

  // Clock
  startClock: () => void;
  pauseClock: () => void;
  setClockSeconds: (seconds: number) => void;
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

  // Disciplinary tick (called when game clock ticks)
  tickDisciplinaryClocks: (deltaSeconds: number) => void;
  // Medical tick (called on real time)
  checkMedicalClocks: () => void;

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
    return id;
  },

  updateMatch: async (updates) => {
    const { match } = get();
    if (!match) return;
    const updatedMatch = { ...match, ...updates, updatedAt: new Date().toISOString() };
    await db.matches.put(updatedMatch);
    set({ match: updatedMatch });
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

  setClockSeconds: (seconds: number) => {
    const { updateMatch } = get();
    updateMatch({ clockSeconds: Math.max(0, seconds) });
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
    get().recalcScores();
    return id;
  },

  editEvent: async (eventId, updates) => {
    const { events } = get();
    const idx = events.findIndex(e => e.id === eventId);
    if (idx < 0) return;

    const updated = { ...events[idx], ...updates, updatedAt: new Date().toISOString() };
    await db.matchEvents.put(updated);

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
  },

  removeRosterEntry: async (id) => {
    await db.matchRoster.delete(id);
    set((state) => ({ roster: state.roster.filter(r => r.id !== id) }));
  },

  // Referees
  addReferee: async (entry) => {
    const id = uuid();
    const full = { ...entry, id };
    await db.matchReferees.add(full);
    set((state) => ({ referees: [...state.referees, full] }));
    return id;
  },

  removeReferee: async (id) => {
    await db.matchReferees.delete(id);
    set((state) => ({ referees: state.referees.filter(r => r.id !== id) }));
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

  // Disciplinary tick
  tickDisciplinaryClocks: (deltaSeconds: number) => {
    set((state) => {
      const updated = state.disciplinaryClocks.map(clock => {
        if (clock.status !== 'active') return clock;

        const newElapsed = clock.elapsedGameSeconds + deltaSeconds;
        if (newElapsed >= clock.durationSeconds) {
          const expired = { ...clock, elapsedGameSeconds: clock.durationSeconds, status: 'expired' as const };
          db.disciplinaryClocks.put(expired);
          return expired;
        }
        // Persist every ~5 seconds
        if (Math.floor(newElapsed / 5) !== Math.floor(clock.elapsedGameSeconds / 5)) {
          db.disciplinaryClocks.put({ ...clock, elapsedGameSeconds: newElapsed });
        }
        return { ...clock, elapsedGameSeconds: newElapsed };
      });
      return { disciplinaryClocks: updated };
    });
  },

  // Medical check
  checkMedicalClocks: () => {
    const now = Date.now();
    set((state) => {
      const updated = state.medicalClocks.map(clock => {
        if (clock.status !== 'active') return clock;
        const elapsed = (now - new Date(clock.startedAt).getTime()) / 1000;
        if (elapsed >= clock.durationSeconds) {
          const expired = { ...clock, status: 'expired' as const };
          db.medicalClocks.put(expired);
          return expired;
        }
        return clock;
      });
      return { medicalClocks: updated };
    });
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

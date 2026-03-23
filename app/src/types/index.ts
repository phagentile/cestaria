// ============================================================
// Cestária — Core Types
// ============================================================

// --- Game Types ---
export type GameTypeName = 'XV' | 'Sevens';

export interface GameTypeConfig {
  halfDuration: number;       // minutes per half (40 for XV, 7 for Sevens)
  players: number;            // 15 or 7
  reserves: number;           // 8 or 5
  maxSubs: number;            // 8 or 5
  yellowCardMinutes: number;  // 10 for XV, 2 for Sevens
  tempRedCardMinutes: number; // 20
  extraTimeDuration: number;  // minutes per extra half (10 for XV, 5 for Sevens)
  interval: number;           // minutes (10 for XV, 2 for Sevens)
  conversionType: 'kick' | 'drop_kick';
}

export const GAME_TYPE_CONFIGS: Record<GameTypeName, GameTypeConfig> = {
  XV: {
    halfDuration: 40,
    players: 15,
    reserves: 8,
    maxSubs: 8,
    yellowCardMinutes: 10,
    tempRedCardMinutes: 20,
    extraTimeDuration: 10,
    interval: 10,
    conversionType: 'kick',
  },
  Sevens: {
    halfDuration: 7,
    players: 7,
    reserves: 5,
    maxSubs: 5,
    yellowCardMinutes: 2,
    tempRedCardMinutes: 20,
    extraTimeDuration: 5,
    interval: 2,
    conversionType: 'drop_kick',
  },
};

// --- Match Status ---
export type MatchStatus = 'scheduled' | 'confirmed' | 'live' | 'finished' | 'reopened';
export type MatchPeriod =
  | 'not_started'
  | 'first_half'
  | 'half_time'
  | 'second_half'
  | 'full_time'
  | 'extra_time_1'
  | 'extra_time_break'
  | 'extra_time_2'
  | 'penalties'
  | 'finished';

// --- Event Types ---
export type EventType =
  | 'try'
  | 'conversion_made'
  | 'conversion_missed'
  | 'penalty_kick_made'
  | 'penalty_kick_missed'
  | 'drop_goal_made'
  | 'drop_goal_missed'
  | 'penalty_try'
  | 'yellow_card'
  | 'red_card'
  | 'temp_red_card'
  | 'substitution_out'
  | 'substitution_in'
  | 'blood_time_start'
  | 'blood_time_end'
  | 'hia_start'
  | 'hia_end'
  | 'period_start'
  | 'period_end';

export const EVENT_POINTS: Partial<Record<EventType, number>> = {
  try: 5,
  conversion_made: 2,
  penalty_kick_made: 3,
  drop_goal_made: 3,
  penalty_try: 7,
};

export const EVENT_LABELS: Record<EventType, string> = {
  try: 'Try',
  conversion_made: 'Conversão',
  conversion_missed: 'Conversão Perdida',
  penalty_kick_made: 'Penal',
  penalty_kick_missed: 'Penal Perdido',
  drop_goal_made: 'Drop Goal',
  drop_goal_missed: 'Drop Perdido',
  penalty_try: 'Penal Try',
  yellow_card: 'Cartão Amarelo',
  red_card: 'Cartão Vermelho',
  temp_red_card: 'Vermelho Temporário',
  substitution_out: 'Saída',
  substitution_in: 'Entrada',
  blood_time_start: 'Início Sangue',
  blood_time_end: 'Fim Sangue',
  hia_start: 'Início HIA',
  hia_end: 'Fim HIA',
  period_start: 'Início Período',
  period_end: 'Fim Período',
};

// --- Card Types ---
export type CardType = 'yellow' | 'red' | 'temp_red';

export const LAW9_REASONS = [
  'Jogo desleal (foul play)',
  'Jogo perigoso (dangerous play)',
  'Conduta antidesportiva',
  'Ofensas repetidas',
  'Obstrução intencional',
  'Tackle perigoso',
  'Jogo sujo (striking/stamping/kicking)',
  'Conflito (fighting)',
  'Linguagem abusiva',
  'Ação contrária ao espírito do jogo',
] as const;

// --- Substitution Types ---
export type SubstitutionType =
  | 'tactical'
  | 'injury'
  | 'blood'
  | 'hia'
  | 'blood_hia'
  | 'front_row'
  | 'temporary';

export const SUBSTITUTION_LABELS: Record<SubstitutionType, string> = {
  tactical: 'Tática',
  injury: 'Lesão',
  blood: 'Sangue',
  hia: 'HIA',
  blood_hia: 'Sangue + HIA',
  front_row: 'Front Row',
  temporary: 'Temporária',
};

// --- Medical Clock Types ---
export type MedicalClockType = 'blood' | 'hia' | 'blood_hia';

export const MEDICAL_DURATIONS: Record<MedicalClockType, number> = {
  blood: 15 * 60,     // 900 seconds (real time)
  hia: 12 * 60,       // 720 seconds (real time)
  blood_hia: 17 * 60, // 1020 seconds (real time)
};

// --- Roster Roles ---
export type RosterRole = 'starter' | 'reserve' | 'staff';

// --- Penalty Shootout ---
export type ShootoutResult = 'made' | 'missed' | 'pending';

// --- User Roles ---
export type UserRole = 'gestor' | 'quarto_arbitro';

// --- Entities ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Confederation {
  id: string;
  name: string;
  acronym: string;
  country: string;
  logoUrl?: string;
}

export interface Federation {
  id: string;
  name: string;
  acronym: string;
  region: string;
  confederationId: string;
  logoUrl?: string;
}

export interface Club {
  id: string;
  name: string;
  acronym: string;
  city: string;
  federationId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Referee {
  id: string;
  name: string;
  usualRole: string;
  federationId: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface GameType {
  id: string;
  name: GameTypeName;
  config: GameTypeConfig;
}

export interface Match {
  id: string;
  homeClubId: string;
  awayClubId: string;
  gameTypeId: string;
  categoryId?: string;
  competitionName?: string;
  venue?: string;
  matchDate?: string;
  startTime?: string;
  endTime?: string;
  status: MatchStatus;
  period: MatchPeriod;
  clockSeconds: number;
  clockRunning: boolean;
  operatedBy?: string;
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchRosterEntry {
  id: string;
  matchId: string;
  clubId: string;
  playerName: string;
  shirtNumber: number;
  position?: string;
  role: RosterRole;
  staffRole?: string;
  active: boolean;
}

export interface MatchRefereeEntry {
  id: string;
  matchId: string;
  refereeId: string;
  roleInMatch: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  clubId?: string;
  rosterId?: string;
  eventType: EventType;
  minute: number;
  second: number;
  period: MatchPeriod;
  points: number;
  metadata?: Record<string, unknown>;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisciplinaryClock {
  id: string;
  matchId: string;
  eventId: string;
  rosterId: string;
  clubId: string;
  clockType: CardType;
  durationSeconds: number;
  elapsedGameSeconds: number;
  status: 'active' | 'expired' | 'cancelled';
}

export interface MedicalClock {
  id: string;
  matchId: string;
  eventId: string;
  rosterId: string;
  clubId: string;
  clockType: MedicalClockType;
  durationSeconds: number;
  startedAt: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface PenaltyShootoutKick {
  id: string;
  matchId: string;
  round: number;
  clubId: string;
  rosterId?: string;
  result: ShootoutResult;
  kickOrder: number;
}

export interface AuditLogEntry {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  timestamp: string;
}

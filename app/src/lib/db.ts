import Dexie, { type EntityTable } from 'dexie';
import type {
  Match,
  MatchEvent,
  MatchRosterEntry,
  MatchRefereeEntry,
  DisciplinaryClock,
  MedicalClock,
  PenaltyShootoutKick,
  AuditLogEntry,
  Confederation,
  Federation,
  Club,
  Referee,
  Category,
  GameType,
  User,
} from '@/types';

class CestariaDB extends Dexie {
  users!: EntityTable<User, 'id'>;
  confederations!: EntityTable<Confederation, 'id'>;
  federations!: EntityTable<Federation, 'id'>;
  clubs!: EntityTable<Club, 'id'>;
  referees!: EntityTable<Referee, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  gameTypes!: EntityTable<GameType, 'id'>;
  matches!: EntityTable<Match, 'id'>;
  matchRoster!: EntityTable<MatchRosterEntry, 'id'>;
  matchReferees!: EntityTable<MatchRefereeEntry, 'id'>;
  matchEvents!: EntityTable<MatchEvent, 'id'>;
  disciplinaryClocks!: EntityTable<DisciplinaryClock, 'id'>;
  medicalClocks!: EntityTable<MedicalClock, 'id'>;
  penaltyShootout!: EntityTable<PenaltyShootoutKick, 'id'>;
  auditLog!: EntityTable<AuditLogEntry, 'id'>;

  constructor() {
    super('cestaria');

    this.version(1).stores({
      users: 'id, email, role',
      confederations: 'id, name',
      federations: 'id, name, confederationId',
      clubs: 'id, name, federationId',
      referees: 'id, name, federationId',
      categories: 'id, name',
      gameTypes: 'id, name',
      matches: 'id, status, matchDate, homeClubId, awayClubId',
      matchRoster: 'id, matchId, clubId, role',
      matchReferees: 'id, matchId, refereeId',
      matchEvents: 'id, matchId, eventType, minute, deletedAt',
      disciplinaryClocks: 'id, matchId, eventId, status',
      medicalClocks: 'id, matchId, eventId, status',
      penaltyShootout: 'id, matchId, round, clubId',
      auditLog: 'id, entity, entityId, timestamp',
    });
  }
}

export const db = new CestariaDB();

// Seed default game types if empty
export async function seedDefaults() {
  const count = await db.gameTypes.count();
  if (count === 0) {
    await db.gameTypes.bulkAdd([
      {
        id: 'gt-xv',
        name: 'XV',
        config: {
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
      },
      {
        id: 'gt-sevens',
        name: 'Sevens',
        config: {
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
      },
    ]);
  }

  // Seed default admin user if empty
  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.add({
      id: 'user-admin',
      email: 'admin@cestaria.app',
      name: 'Administrador',
      role: 'gestor',
    });
  }
}

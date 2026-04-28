import Dexie, { type EntityTable } from 'dexie';
import bcrypt from 'bcryptjs';
import type {
  Match,
  MatchEvent,
  MatchRosterEntry,
  MatchRefereeEntry,
  MatchZoneOfficial,
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
  OrganizingEntity,
  EntityLevel,
} from '@/types';

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // Support legacy plain-text passwords during migration: if hash doesn't look
  // like a bcrypt hash ($2a/2b prefix) fall back to direct comparison, then
  // the caller should rehash on success.
  if (!hash.startsWith('$2')) return plain === hash;
  return bcrypt.compare(plain, hash);
}

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
  organizingEntities!: EntityTable<OrganizingEntity, 'id'>;
  matchZoneOfficials!: EntityTable<MatchZoneOfficial, 'id'>;

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

    this.version(2).stores({
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
      organizingEntities: 'id, name, level, parentId',
    });

    this.version(3).stores({
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
      organizingEntities: 'id, name, level, parentId',
    }).upgrade(async (tx) => {
      await tx.table('users').toCollection().modify((user) => {
        if (!user.password) user.password = 'changeme';
        if (user.email) user.email = user.email.toLowerCase();
      });
    });

    this.version(4).stores({
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
      organizingEntities: 'id, name, level, parentId',
    }).upgrade(async (tx) => {
      // No-op: test user creation moved to seedDefaults()
      void tx;
    });

    this.version(5).stores({
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
      organizingEntities: 'id, name, level, parentId',
    }).upgrade(async (tx) => {
      // No-op: seed users created in seedDefaults() with hashed passwords
      void tx;
    });

    this.version(6).stores({
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
      organizingEntities: 'id, name, level, parentId',
      matchZoneOfficials: 'id, matchId, userId, role',
    });

    // version 7: rehash any plain-text passwords still in IndexedDB
    this.version(7).stores({
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
      organizingEntities: 'id, name, level, parentId',
      matchZoneOfficials: 'id, matchId, userId, role',
    }).upgrade(async (tx) => {
      const users = await tx.table('users').toArray();
      for (const user of users) {
        if (user.password && !user.password.startsWith('$2')) {
          const hashed = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
          await tx.table('users').update(user.id, { password: hashed });
        }
      }
    });
  }
}

export const db = new CestariaDB();

// Seed default game types and users if empty
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

  const userCount = await db.users.count();
  if (userCount === 0) {
    // Passwords read from env vars — never hardcoded in source
    const seedUsers = [
      {
        id: 'user-admin',
        email: 'admin@rugbymatchpro.app',
        password: process.env.NEXT_PUBLIC_SEED_PASSWORD_ADMIN ?? 'changeme-set-env',
        name: 'Administrador',
        role: 'gestor' as const,
      },
      {
        id: 'user-teste',
        email: 'teste@teste.com',
        password: process.env.NEXT_PUBLIC_SEED_PASSWORD_TESTE ?? 'changeme-set-env',
        name: 'Usuário Teste',
        role: 'gestor' as const,
      },
      { id: 'user-gestor',  email: 'gestor@rugbymatch.app',     password: process.env.NEXT_PUBLIC_SEED_PASSWORD_GESTOR   ?? 'changeme-set-env', name: 'Gestor',                   role: 'gestor' as const },
      { id: 'user-4arb',   email: '4arbitro@rugbymatch.app',   password: process.env.NEXT_PUBLIC_SEED_PASSWORD_4ARB     ?? 'changeme-set-env', name: '4º Árbitro',               role: 'quarto_arbitro' as const },
      { id: 'user-slo-a',  email: 'sideline.a@rugbymatch.app', password: process.env.NEXT_PUBLIC_SEED_PASSWORD_SIDEO_A  ?? 'changeme-set-env', name: 'Sideline Official Time A', role: 'sideline_official_a' as const },
      { id: 'user-slo-b',  email: 'sideline.b@rugbymatch.app', password: process.env.NEXT_PUBLIC_SEED_PASSWORD_SIDEO_B  ?? 'changeme-set-env', name: 'Sideline Official Time B', role: 'sideline_official_b' as const },
      { id: 'user-tm-a',   email: 'manager.a@rugbymatch.app',  password: process.env.NEXT_PUBLIC_SEED_PASSWORD_TM_A     ?? 'changeme-set-env', name: 'Team Manager Time A',      role: 'team_manager_a' as const },
      { id: 'user-tm-b',   email: 'manager.b@rugbymatch.app',  password: process.env.NEXT_PUBLIC_SEED_PASSWORD_TM_B     ?? 'changeme-set-env', name: 'Team Manager Time B',      role: 'team_manager_b' as const },
      { id: 'user-tzm',    email: 'zona@rugbymatch.app',       password: process.env.NEXT_PUBLIC_SEED_PASSWORD_TZM      ?? 'changeme-set-env', name: 'Technical Zone Manager',   role: 'technical_zone_manager' as const },
    ];

    for (const u of seedUsers) {
      const hashed = await hashPassword(u.password);
      await db.users.add({ ...u, password: hashed });
    }
  }

  const entityCount = await db.organizingEntities.count();
  if (entityCount === 0) {
    await db.organizingEntities.bulkAdd([
      { id: 'oe-world-rugby', name: 'World Rugby',       acronym: 'WR',  level: 'world' as EntityLevel },
      { id: 'oe-sudamerica',  name: 'Sudamérica Rugby',  acronym: 'SAR', level: 'continental' as EntityLevel },
      { id: 'oe-brasil',      name: 'Brasil Rugby',      acronym: 'BR',  level: 'national' as EntityLevel, country: 'Brasil' },
      { id: 'oe-fpr',         name: 'FPR',               acronym: 'FPR', level: 'state' as EntityLevel, region: 'SP', parentId: 'oe-brasil' },
      { id: 'oe-liga-vale',   name: 'Liga do Vale',      acronym: 'LV',  level: 'regional' as EntityLevel, region: 'Vale do Paraíba', parentId: 'oe-fpr' },
    ]);
  }
}

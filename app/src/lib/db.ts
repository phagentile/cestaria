import Dexie, { type EntityTable } from 'dexie';
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

    // version 3: password field added to users (no store schema change needed, Dexie stores all fields)
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
      // Backfill password for existing users
      await tx.table('users').toCollection().modify((user) => {
        if (!user.password) {
          user.password = 'admin123';
        }
        // Normalize email to lowercase
        if (user.email) user.email = user.email.toLowerCase();
      });
    });

    // version 4-orig: ensure test user exists
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
      const existing = await tx.table('users').where('email').equals('teste@teste.com').first();
      if (!existing) {
        await tx.table('users').add({
          id: 'user-teste',
          email: 'teste@teste.com',
          password: "[REDACTED]",
          name: 'Usuário Teste',
          role: 'gestor',
        });
      }
    });

    // version 5: seed all 7 match-day role users
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
      const matchDayUsers = [
        { id: 'user-gestor',    email: 'gestor@rugbymatch.app',    password: "[REDACTED]",    name: 'Gestor',                     role: 'gestor' },
        { id: 'user-4arb',      email: '4arbitro@rugbymatch.app',  password: "[REDACTED]",      name: '4º Árbitro',                 role: 'quarto_arbitro' },
        { id: 'user-slo-a',     email: 'sideline.a@rugbymatch.app',password: "[REDACTED]",     name: 'Sideline Official Time A',   role: 'sideline_official_a' },
        { id: 'user-slo-b',     email: 'sideline.b@rugbymatch.app',password: "[REDACTED]",     name: 'Sideline Official Time B',   role: 'sideline_official_b' },
        { id: 'user-tm-a',      email: 'manager.a@rugbymatch.app', password: "[REDACTED]",      name: 'Team Manager Time A',        role: 'team_manager_a' },
        { id: 'user-tm-b',      email: 'manager.b@rugbymatch.app', password: "[REDACTED]",      name: 'Team Manager Time B',        role: 'team_manager_b' },
        { id: 'user-tzm',       email: 'zona@rugbymatch.app',      password: "[REDACTED]",      name: 'Technical Zone Manager',     role: 'technical_zone_manager' },
      ];
      for (const u of matchDayUsers) {
        const exists = await tx.table('users').where('email').equals(u.email).first();
        if (!exists) await tx.table('users').add(u);
      }
    });

    // version 6: add matchZoneOfficials table
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
    await db.users.bulkAdd([
      {
        id: 'user-admin',
        email: 'admin@rugbymatchpro.app'.toLowerCase(),
        password: "[REDACTED]",
        name: 'Administrador',
        role: 'gestor',
      },
      {
        id: 'user-teste',
        email: 'teste@teste.com',
        password: "[REDACTED]",
        name: 'Usuário Teste',
        role: 'gestor',
      },
    ]);
  }

  // Seed default organizing entities if empty
  const entityCount = await db.organizingEntities.count();
  if (entityCount === 0) {
    await db.organizingEntities.bulkAdd([
      { id: 'oe-world-rugby', name: 'World Rugby', acronym: 'WR', level: 'world' as EntityLevel },
      { id: 'oe-sudamerica', name: 'Sudamérica Rugby', acronym: 'SAR', level: 'continental' as EntityLevel },
      { id: 'oe-brasil', name: 'Brasil Rugby', acronym: 'BR', level: 'national' as EntityLevel, country: 'Brasil' },
      { id: 'oe-fpr', name: 'FPR', acronym: 'FPR', level: 'state' as EntityLevel, region: 'SP', parentId: 'oe-brasil' },
      { id: 'oe-liga-vale', name: 'Liga do Vale', acronym: 'LV', level: 'regional' as EntityLevel, region: 'Vale do Paraíba', parentId: 'oe-fpr' },
    ]);
  }
}

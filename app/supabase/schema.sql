-- Rugby Match Pro — Supabase Schema
-- Run this in the Supabase SQL editor to create all tables.

-- Admin / Reference data

CREATE TABLE IF NOT EXISTS confederations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT,
  country TEXT,
  level TEXT,
  logo_url TEXT
);

CREATE TABLE IF NOT EXISTS federations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT,
  country TEXT,
  region TEXT,
  confederation_id TEXT REFERENCES confederations(id),
  level TEXT,
  logo_url TEXT
);

CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT,
  city TEXT,
  country TEXT,
  federation_id TEXT REFERENCES federations(id),
  primary_color TEXT,
  secondary_color TEXT,
  logo_url TEXT
);

CREATE TABLE IF NOT EXISTS referees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  federation_id TEXT REFERENCES federations(id),
  usual_role TEXT,
  email TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS game_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  players_per_side INTEGER,
  half_duration_minutes INTEGER,
  extra_time_minutes INTEGER,
  has_shootout BOOLEAN DEFAULT FALSE,
  yellow_card_minutes INTEGER,
  temp_red_minutes INTEGER,
  medical_minutes INTEGER
);

CREATE TABLE IF NOT EXISTS organizing_entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT,
  level TEXT,
  country TEXT,
  region TEXT,
  parent_id TEXT REFERENCES organizing_entities(id),
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Match data

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  home_club_id TEXT REFERENCES clubs(id),
  away_club_id TEXT REFERENCES clubs(id),
  game_type_id TEXT REFERENCES game_types(id),
  category_id TEXT REFERENCES categories(id),
  competition TEXT,
  venue TEXT,
  date TEXT,
  scheduled_start TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  period TEXT NOT NULL DEFAULT 'not_started',
  clock_seconds FLOAT NOT NULL DEFAULT 0,
  clock_running BOOLEAN NOT NULL DEFAULT FALSE,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  closed_at TEXT,
  closed_by TEXT,
  reopened_at TEXT,
  reopened_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_roster (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  club_id TEXT REFERENCES clubs(id),
  player_name TEXT,
  player_id TEXT,
  jersey_number INTEGER,
  position TEXT,
  role TEXT NOT NULL,
  staff_role TEXT,
  is_referee BOOLEAN DEFAULT FALSE,
  referee_role TEXT,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS match_referees (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  referee_id TEXT REFERENCES referees(id),
  referee_name TEXT,
  role_in_match TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_events (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  club_id TEXT,
  roster_id TEXT,
  event_type TEXT NOT NULL,
  minute INTEGER,
  second INTEGER,
  period TEXT,
  points INTEGER DEFAULT 0,
  metadata JSONB,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS disciplinary_clocks (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES match_events(id),
  club_id TEXT,
  roster_id TEXT,
  card_type TEXT NOT NULL,
  duration_seconds FLOAT NOT NULL,
  remaining_seconds FLOAT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medical_clocks (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES match_events(id),
  club_id TEXT,
  roster_id TEXT,
  clock_type TEXT NOT NULL,
  duration_seconds FLOAT NOT NULL,
  remaining_seconds FLOAT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL,
  started_real_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS penalty_shootout (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  club_id TEXT,
  roster_id TEXT,
  order_index INTEGER NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id TEXT,
  timestamp TEXT NOT NULL
);

-- Enable Row Level Security (optional — requires auth setup)
-- ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public_access" ON matches FOR ALL USING (true);


CREATE TABLE IF NOT EXISTS match_zone_officials (
  id           TEXT PRIMARY KEY,
  match_id     TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN (
                 'quarto_arbitro',
                 'sideline_official_a',
                 'sideline_official_b',
                 'sideline_official_both',
                 'team_manager_a',
                 'team_manager_b',
                 'technical_zone_controller_a',
                 'technical_zone_controller_b',
                 'technical_zone_manager'
               )),
  created_at   TEXT NOT NULL,
  UNIQUE (match_id, role)
);

ALTER TABLE match_zone_officials ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all ON match_zone_officials FOR ALL USING (true) WITH CHECK (true);

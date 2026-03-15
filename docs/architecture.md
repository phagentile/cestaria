# Cestária — Documento de Arquitetura Técnica

## Visão Geral da Arquitetura

---

# 1. PRINCÍPIO FUNDAMENTAL: LOCAL-FIRST

O Cestária é um app **local-first**. Toda a lógica de negócio, estado e persistência funcionam no navegador. O servidor é uma camada de backup, sincronização e administração — nunca uma dependência para a operação ao vivo.

```
┌─══════════════════════════════════════════════════════════════┐
║                      NAVEGADOR (Core)                         ║
║                                                               ║
║  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ ║
║  │   React     │  │   Zustand   │  │   Dexie.js           │ ║
║  │   (UI)      │◄►│   (State)   │◄►│   (IndexedDB)        │ ║
║  │             │  │             │  │   Persistência local  │ ║
║  └─────────────┘  └──────┬──────┘  └──────────────────────┘ ║
║                          │                                    ║
║                 ┌────────▼────────┐                          ║
║                 │   Sync Engine   │                          ║
║                 │   (Queue +      │                          ║
║                 │    Reconciler)  │                          ║
║                 └────────┬────────┘                          ║
║                          │                                    ║
║  ┌───────────────────────┼───────────────────────────────┐   ║
║  │              Service Worker (PWA)                      │   ║
║  │   Cache de assets + interceptor de rede               │   ║
║  └───────────────────────┼───────────────────────────────┘   ║
╚═══════════════════════════╪═══════════════════════════════════╝
                            │
              quando online │
                            ▼
┌─══════════════════════════════════════════════════════════════┐
║                     SERVIDOR (Backup)                         ║
║                                                               ║
║  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ ║
║  │  Next.js    │  │  tRPC /     │  │   PostgreSQL          │ ║
║  │  API Routes │◄►│  Services   │◄►│   (Neon/Supabase)     │ ║
║  └─────────────┘  └─────────────┘  └──────────────────────┘ ║
║                                                               ║
║  ┌─────────────┐  ┌─────────────┐                            ║
║  │  Auth.js    │  │  Audit Log  │                            ║
║  │  (JWT)      │  │  Service    │                            ║
║  └─────────────┘  └─────────────┘                            ║
╚═══════════════════════════════════════════════════════════════╝
```

---

# 2. CAMADAS DA APLICAÇÃO

## 2.1 Camada de Apresentação (React + shadcn/ui)

```
src/app/
├── (auth)/
│   └── login/page.tsx
├── (admin)/                        # Área do Gestor
│   ├── layout.tsx                  # Guard: somente Gestor
│   ├── dashboard/page.tsx
│   ├── confederations/page.tsx
│   ├── federations/page.tsx
│   ├── clubs/page.tsx
│   ├── referees/page.tsx
│   ├── categories/page.tsx
│   ├── game-types/page.tsx
│   └── matches/
│       ├── page.tsx                # Lista de partidas
│       └── new/page.tsx            # Criar partida
├── (match)/                        # Área do Quarto Árbitro
│   ├── layout.tsx                  # Guard: Gestor ou Quarto Árbitro
│   ├── matches/page.tsx            # Partidas designadas
│   └── match/[id]/
│       └── page.tsx                # MESA DE CONTROLE (core)
└── layout.tsx                      # Root layout
```

## 2.2 Camada de Estado (Zustand)

Stores separados por módulo, compostos no store global:

```typescript
// Exemplo conceitual de arquitetura de stores

// Store do Jogo
interface MatchControlStore {
  matchId: string;
  status: MatchStatus;          // scheduled | live | finished | reopened
  period: Period;                // first_half | half_time | second_half | extra_time | penalties
  clockSeconds: number;
  clockRunning: boolean;
  gameType: GameTypeConfig;      // Parâmetros XV ou Sevens

  // Actions
  startClock: () => void;
  pauseClock: () => void;
  resetClock: () => void;
  setManualTime: (seconds: number) => void;
  nextPeriod: () => void;
  endMatch: () => void;
  reopenMatch: () => void;
}

// Store de Eventos (Timeline)
interface EventStore {
  events: MatchEvent[];

  // Actions
  addEvent: (event: NewEvent) => void;
  editEvent: (id: string, updates: Partial<MatchEvent>) => void;
  deleteEvent: (id: string) => void;  // soft delete

  // Derived
  homeScore: number;    // computed: sum of home team points
  awayScore: number;    // computed: sum of away team points
}

// Store de Cronômetros
interface TimerStore {
  disciplinaryClocks: DisciplinaryClock[];  // pausam com jogo
  medicalClocks: MedicalClock[];            // NÃO pausam com jogo

  startDisciplinary: (cardEvent: CardEvent) => void;
  startMedical: (subEvent: SubstitutionEvent) => void;
  tickGameTime: (deltaSeconds: number) => void;  // só disciplinares
  tickRealTime: () => void;                       // só médicos
}
```

**Middleware de persistência:**
```
Zustand store ←→ Dexie.js middleware ←→ IndexedDB
                                          ↓
                                    Sync Queue ←→ Servidor
```

Toda mutação no store é automaticamente:
1. Persistida em IndexedDB (imediato)
2. Enfileirada para sync com servidor (quando online)

## 2.3 Camada de Persistência Local (Dexie.js)

```typescript
// Schema conceitual do IndexedDB

const db = new Dexie('cestaria');

db.version(1).stores({
  matches: 'id, status, date',
  matchEvents: 'id, matchId, eventType, minute',
  matchRoster: 'id, matchId, clubId',
  disciplinaryClocks: 'id, matchId, eventId',
  medicalClocks: 'id, matchId, eventId',
  penaltyShootout: 'id, matchId, round',
  syncQueue: '++id, syncedAt',
  auditLog: '++id, entityId, timestamp',

  // Cadastros mestres (cache local, readonly offline)
  confederations: 'id',
  federations: 'id, confederationId',
  clubs: 'id, federationId',
  referees: 'id',
  categories: 'id',
  gameTypes: 'id',
});
```

## 2.4 Camada de Sincronização

### Sync Queue

Toda operação que precisa ir para o servidor é enfileirada:

```typescript
interface SyncOperation {
  id: string;           // UUID gerado no client
  type: 'create' | 'update' | 'delete';
  entity: string;       // 'matchEvent', 'matchRoster', etc.
  entityId: string;
  payload: unknown;      // Dados da operação
  createdAt: string;    // ISO timestamp
  syncedAt?: string;    // null = pendente
}
```

### Fluxo de Sync

```
1. Operador registra evento
2. Store atualiza (UI imediata)
3. IndexedDB persiste (durável)
4. SyncQueue enfileira operação
5. Se online: envia imediatamente
6. Se offline: aguarda
7. Ao reconectar: envia TODAS as pendentes (FIFO)
8. Servidor aplica em transação
9. Marca como synced
```

### Resolução de Conflito: Offline Wins

```
LOCAL (IndexedDB) vs SERVIDOR (PostgreSQL)

Ao sync:
1. Client envia batch de operações com timestamps
2. Servidor aplica em ordem de timestamp
3. Se campo foi alterado no servidor enquanto client offline:
   → CLIENT VENCE (sobrescreve)
4. Cadastros mestres: SERVIDOR vence (readonly no client)
```

## 2.5 Camada de API (Servidor)

```
POST   /api/v1/sync                    # Batch sync de operações
GET    /api/v1/matches                  # Lista de partidas
POST   /api/v1/matches                  # Criar partida
GET    /api/v1/matches/:id              # Detalhes da partida
PATCH  /api/v1/matches/:id              # Atualizar partida
POST   /api/v1/matches/:id/close       # Encerrar partida
POST   /api/v1/matches/:id/reopen      # Reabrir partida

# Cadastros mestres (CRUD pelo Gestor)
GET/POST/PATCH/DELETE /api/v1/confederations
GET/POST/PATCH/DELETE /api/v1/federations
GET/POST/PATCH/DELETE /api/v1/clubs
GET/POST/PATCH/DELETE /api/v1/referees
GET/POST/PATCH/DELETE /api/v1/categories
GET/POST/PATCH/DELETE /api/v1/game-types

# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

# Audit
GET    /api/v1/audit/:entityType/:entityId   # Histórico de uma entidade
```

---

# 3. SISTEMA DE CRONÔMETROS

## 3.1 Arquitetura de Timers

```
                    ┌────────────────────┐
                    │   Clock Engine     │
                    │   (requestAnimationFrame │
                    │    + performance.now)     │
                    └──────────┬─────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
          ┌─────────▼──────────┐  ┌──────▼──────────────┐
          │  GameTimeTimer     │  │  RealTimeTimer       │
          │                    │  │                      │
          │  - Pausa com jogo  │  │  - NUNCA pausa       │
          │  - Relógio principal│  │  - Baseado em Date   │
          │  - Disciplinares   │  │  - Médicos           │
          │  - Usa delta do    │  │  - Usa started_at +  │
          │    game clock      │  │    duration           │
          └────────────────────┘  └──────────────────────┘
```

## 3.2 GameTimeTimer (Relógio Principal + Disciplinares)

```typescript
// Conceitual

class GameTimeEngine {
  private lastTick: number = 0;
  private running: boolean = false;
  private accumulatedMs: number = 0;

  start() {
    this.running = true;
    this.lastTick = performance.now();
    this.loop();
  }

  pause() {
    this.running = false;
    // Disciplinares pausam automaticamente (não recebem mais ticks)
  }

  private loop() {
    if (!this.running) return;

    const now = performance.now();
    const delta = now - this.lastTick;
    this.lastTick = now;

    // Corrige drift acumulado
    this.accumulatedMs += delta;
    const seconds = Math.floor(this.accumulatedMs / 1000);

    // Atualiza relógio principal
    this.updateMainClock(seconds);

    // Atualiza TODOS os disciplinares ativos
    this.updateDisciplinaryClocks(delta);

    requestAnimationFrame(() => this.loop());
  }
}
```

## 3.3 RealTimeTimer (Médicos)

```typescript
// Conceitual

class RealTimeTimer {
  // Não precisa de loop — calcula sob demanda
  static getRemaining(startedAt: Date, durationMs: number): number {
    const elapsed = Date.now() - startedAt.getTime();
    return Math.max(0, durationMs - elapsed);
  }

  // Expiry check
  static isExpired(startedAt: Date, durationMs: number): boolean {
    return this.getRemaining(startedAt, durationMs) <= 0;
  }
}
```

## 3.4 Proteção contra Background Tab Throttling

Navegadores limitam `setInterval` e `requestAnimationFrame` em tabs inativas.

**Estratégia:**
1. A cada tick, salvar `{ clockSeconds, timestamp }` no IndexedDB
2. Ao retornar para a tab (evento `visibilitychange`):
   - Calcular tempo real decorrido desde último tick
   - Se jogo estava rodando: adicionar o delta ao relógio
   - Atualizar disciplinares com o delta
   - Médicos não precisam de ajuste (são baseados em `started_at`)

---

# 4. GERAÇÃO DE PDF NO BROWSER

O sistema DEVE gerar PDFs no navegador (offline-first). O servidor pode oferecer como fallback, mas não é dependência.

## 4.1 Stack

- **@react-pdf/renderer** para geração no browser
- Componentes React que renderizam para PDF
- Mesmo modelo de dados do estado (Zustand)

## 4.2 Formatos

### PDF 1: Timeline de Eventos
```
┌──────────────────────────────────────────┐
│          [Logo A]  PLACAR  [Logo B]      │
│          Time A    21-18   Time B        │
│                                          │
│  Data | Local | Competição | Categoria   │
├──────────────────────────────────────────┤
│  MIN  │ TIME      │ EVENTO        │ PLACAR│
│  05:23│ Time A    │ Try #11       │  5-0  │
│  06:45│ Time A    │ Conv #10      │  7-0  │
│  ...  │ ...       │ ...           │  ...  │
└──────────────────────────────────────────┘
```

### PDF 2: Súmula Oficial
```
┌──────────────────────────────────────────┐
│  SÚMULA OFICIAL                          │
│  [Dados da partida, competição, local]   │
├────────────────────┬─────────────────────┤
│  TIME A            │  TIME B             │
│  ──────            │  ──────             │
│  Titulares:        │  Titulares:         │
│  #1 Nome - Posição │  #1 Nome - Posição  │
│  ...               │  ...                │
│  Reservas:         │  Reservas:          │
│  ...               │  ...                │
│  Comissão:         │  Comissão:          │
│  ...               │  ...                │
├────────────────────┴─────────────────────┤
│  ÁRBITROS                                │
│  Central: Nome | AR1: Nome | AR2: Nome   │
│  TMO: Nome | 4º Árbitro: Nome           │
├──────────────────────────────────────────┤
│  RESULTADO: Time A 21 x 18 Time B       │
│  1T: 7-3 | 2T: 14-15 | Penais: (3-2)  │
└──────────────────────────────────────────┘
```

### PDF 3: Completo (Timeline + Súmula)
Combinação dos dois acima em um único documento.

---

# 5. AUTENTICAÇÃO OFFLINE

## 5.1 JWT com Long-Lived Refresh Token

```
Login (online):
1. Usuário envia credenciais
2. Servidor retorna:
   - access_token (JWT, 1h, contém: userId, role, permissions)
   - refresh_token (opaque, 30 dias)
3. Ambos salvos em IndexedDB (secure)

Operação offline:
1. Access token verificado localmente (JWT é self-contained)
2. Permissões extraídas do token
3. Não precisa de servidor para verificar autorização

Reconexão:
1. Se access_token expirou: usa refresh_token para obter novo
2. Se refresh_token expirou: força re-login
```

## 5.2 Permissões por Perfil

```typescript
const PERMISSIONS = {
  gestor: {
    canManageMasterData: true,
    canCreateMatch: true,
    canOperateMatch: true,
    canReopenMatch: true,
    canManageUsers: true,
    canViewAudit: true,
    canExport: true,
  },
  quartoArbitro: {
    canManageMasterData: false,  // readonly
    canCreateMatch: false,
    canOperateMatch: true,
    canReopenMatch: true,
    canViewAudit: false,
    canExport: true,             // com aprovação
  },
} as const;
```

---

# 6. MODELO DE DADOS (PostgreSQL)

```sql
-- Cadastros Mestres

CREATE TABLE confederations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  acronym VARCHAR(20),
  country VARCHAR(100),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE federations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  acronym VARCHAR(20),
  region VARCHAR(100),
  confederation_id UUID REFERENCES confederations(id),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  acronym VARCHAR(20),
  city VARCHAR(100),
  federation_id UUID REFERENCES federations(id),
  logo_url TEXT,
  primary_color VARCHAR(7),    -- hex
  secondary_color VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  usual_role VARCHAR(50),      -- central, AR, TMO, 4th
  federation_id UUID REFERENCES federations(id),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,  -- adulto, juvenil, M19, M21, feminino
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,   -- 'XV', 'Sevens'
  config JSONB NOT NULL,       -- { half_duration, players, reserves, max_subs, yellow_card_minutes, ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partida

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_club_id UUID NOT NULL REFERENCES clubs(id),
  away_club_id UUID NOT NULL REFERENCES clubs(id),
  game_type_id UUID NOT NULL REFERENCES game_types(id),
  category_id UUID REFERENCES categories(id),
  competition_name VARCHAR(200),
  venue VARCHAR(200),
  match_date DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    -- scheduled, live, finished, reopened
  period VARCHAR(30),
    -- first_half, half_time, second_half, extra_time_1, extra_time_2, penalties
  clock_seconds INTEGER DEFAULT 0,
  clock_running BOOLEAN DEFAULT FALSE,
  operated_by UUID,            -- user_id do Quarto Árbitro
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  reopened_at TIMESTAMPTZ,
  reopened_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  club_id UUID NOT NULL REFERENCES clubs(id),
  player_name VARCHAR(200) NOT NULL,
  shirt_number INTEGER NOT NULL,
  position VARCHAR(50),
  role VARCHAR(20) NOT NULL,   -- starter, reserve, staff
  staff_role VARCHAR(50),      -- técnico, auxiliar, médico, fisio (se role = staff)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  referee_id UUID NOT NULL REFERENCES referees(id),
  role_in_match VARCHAR(30) NOT NULL,  -- central, ar1, ar2, tmo, fourth
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  club_id UUID REFERENCES clubs(id),
  roster_id UUID REFERENCES match_roster(id),  -- jogador ou staff
  event_type VARCHAR(50) NOT NULL,
  minute INTEGER NOT NULL,
  second INTEGER DEFAULT 0,
  period VARCHAR(30),
  points INTEGER DEFAULT 0,
  metadata JSONB,              -- motivo Lei 9, tipo sub, descrição, linked_event_id, etc.
  deleted_at TIMESTAMPTZ,      -- soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE disciplinary_clocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  event_id UUID NOT NULL REFERENCES match_events(id),
  roster_id UUID NOT NULL REFERENCES match_roster(id),
  club_id UUID NOT NULL REFERENCES clubs(id),
  clock_type VARCHAR(20) NOT NULL,  -- yellow, temp_red
  duration_seconds INTEGER NOT NULL, -- 600 (XV yellow), 120 (Sevens yellow), 1200 (temp_red)
  elapsed_game_seconds INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medical_clocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  event_id UUID NOT NULL REFERENCES match_events(id),
  roster_id UUID NOT NULL REFERENCES match_roster(id),
  club_id UUID NOT NULL REFERENCES clubs(id),
  clock_type VARCHAR(20) NOT NULL,  -- blood, hia, blood_hia
  duration_seconds INTEGER NOT NULL, -- 900, 720, 1020
  started_at TIMESTAMPTZ NOT NULL,   -- real time start
  status VARCHAR(20) DEFAULT 'active', -- active, expired, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE penalty_shootout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  round INTEGER NOT NULL,
  club_id UUID NOT NULL REFERENCES clubs(id),
  roster_id UUID REFERENCES match_roster(id),
  result VARCHAR(10) NOT NULL, -- made, missed
  kick_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(10) NOT NULL, -- create, update, delete
  entity VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  client_timestamp TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- create, update, delete, close, reopen, login, logout
  field VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  user_id UUID,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL,   -- gestor, quarto_arbitro
  password_hash TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices

CREATE INDEX idx_match_events_match_id ON match_events(match_id);
CREATE INDEX idx_match_events_type ON match_events(event_type);
CREATE INDEX idx_match_events_not_deleted ON match_events(match_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_match_roster_match_id ON match_roster(match_id);
CREATE INDEX idx_disciplinary_active ON disciplinary_clocks(match_id) WHERE status = 'active';
CREATE INDEX idx_medical_active ON medical_clocks(match_id) WHERE status = 'active';
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_sync_pending ON sync_queue(synced_at) WHERE synced_at IS NULL;
```

---

# 7. ESTRATÉGIA DE TESTES

## 7.1 Pirâmide de Testes

```
         ┌──────────┐
         │   E2E    │  5-10 cenários completos (Playwright)
         │ Playwright│
        ┌┴──────────┴┐
        │ Integration │  30-50 fluxos (Testing Library + MSW)
       ┌┴────────────┴┐
       │    Unit       │  200+ testes (Vitest)
       │   Vitest      │  Lógica de negócio pura
       └───────────────┘
```

## 7.2 O que testar unitariamente (obrigatório)

- Cálculo de placar (todos os tipos de evento, incluindo exclusão)
- Lógica de GameTimeTimer (start, pause, drift correction)
- Lógica de RealTimeTimer (cálculo de remaining)
- Regras de penal try (7 pontos, sem jogador)
- Regras de substituição (tipos, validação)
- Parâmetros XV vs Sevens (duração, cartão amarelo)
- Resolução de conflitos de sync
- Permissões por perfil

## 7.3 E2E obrigatórios

1. Partida XV completa (80 min simulados): criar → operar → encerrar → exportar
2. Partida Sevens completa
3. Operação offline: desconectar → operar → reconectar → verificar sync
4. Disputa de penais com morte súbita
5. Encerrar → reabrir → verificar log

---

# 8. CI/CD PIPELINE

```yaml
# Conceitual — GitHub Actions

name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Install deps (pnpm)
      - Lint (Biome)
      - Typecheck (tsc --noEmit)
      - Unit tests (Vitest)
      - Integration tests (Vitest + Testing Library)
      - Build

  e2e:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - Setup Playwright
      - Start app
      - Run E2E tests
      - Upload screenshots on failure

  deploy-staging:
    needs: [quality, e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - Deploy to Vercel (preview)

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - Deploy to Vercel (production)
```

---

# 9. PERFORMANCE BUDGET

| Métrica | Target | Como garantir |
|---------|--------|--------------|
| Interação → resposta visual | < 120ms | Zustand (sync), sem async na UI |
| Timer drift após 80 min | < 100ms | `performance.now()` + drift correction |
| IndexedDB write | < 50ms | Dexie.js com bulk operations |
| PDF generation (browser) | < 5s | @react-pdf otimizado, lazy load |
| Sync batch (50 ops) | < 10s | tRPC batch, transação única |
| First Contentful Paint | < 1.5s | Next.js SSR + code splitting |
| PWA install + offline ready | < 3s | Workbox precaching |

---

*Documento de arquitetura técnica — v1.0 — 15/03/2026*

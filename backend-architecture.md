# Backend Unificado - Rugby Analytics Ecosystem

## Estrutura de Pastas Recomendada

```
rugby-backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── matches.js          # POST/GET /api/matches
│   │   │   ├── events.js           # POST /api/matches/:id/events
│   │   │   ├── analytics.js        # POST /api/analytics/teams/:id/stats
│   │   │   ├── evaluations.js      # POST /api/matches/:id/evaluation
│   │   │   ├── exports.js          # GET /api/matches/:id/export/pdf
│   │   │   └── auth.js             # POST /api/auth/login
│   │   │
│   │   ├── controllers/
│   │   │   ├── matchController.js
│   │   │   ├── eventController.js
│   │   │   ├── analyticsController.js
│   │   │   └── exportController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT validation
│   │   │   ├── validation.js       # Schema validation
│   │   │   └── errorHandler.js
│   │   │
│   │   └── models/
│   │       ├── Match.js
│   │       ├── Event.js
│   │       ├── TeamStats.js
│   │       └── Evaluation.js
│   │
│   ├── services/
│   │   ├── pdfService.js           # Geração PDF com pdfkit
│   │   ├── geminiService.js        # Integração IA
│   │   ├── firebaseService.js      # Auth + Realtime DB
│   │   ├── storageService.js       # Upload arquivos
│   │   └── notificationService.js  # Webhooks
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── constants.js
│   │
│   └── app.js                       # Express app setup
│
├── config/
│   ├── database.js                  # MySQL config
│   ├── firebase.js                  # Firebase config
│   └── env.example
│
├── tests/
│   └── integration.test.js
│
├── package.json
└── .env
```

## 📦 Dependências Necessárias

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "firebase-admin": "^11.11.1",
    "jwt-simple": "^0.5.6",
    "pdfkit": "^0.13.0",
    "axios": "^1.4.0",
    "@google/generative-ai": "^0.1.3",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "joi": "^17.11.0"
  }
}
```

## 🔑 Tabelas MySQL (Schema)

```sql
-- Partidas Principal
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_uuid VARCHAR(36) UNIQUE,
    competition_id INT,
    home_team_id INT,
    away_team_id INT,
    match_date DATETIME,
    status ENUM('setup', 'live', 'finished'),
    referee_id INT,
    evaluator_id INT,
    match_data JSON,  -- Dados pré-jogo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referee_id) REFERENCES users(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

-- Eventos (Timeline)
CREATE TABLE match_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_uuid VARCHAR(36) UNIQUE,
    match_id INT,
    event_type ENUM('penalty', 'scrum', 'lineout', 'maul', 'try', 'card', 'substitution'),
    team VARCHAR(1),  -- 'A' ou 'B'
    player_number VARCHAR(50),
    game_time TIME,
    timestamp_exact DATETIME,
    referee_comment TEXT,
    evaluator_comment TEXT,
    evaluator_feedback ENUM('no_detect', 'error', 'doubt', 'good', 'team_three'),
    high_impact BOOLEAN DEFAULT FALSE,
    card_type ENUM('yellow', 'red_20', 'red_permanent'),
    created_by INT,  -- user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX (match_id, team, event_type)
);

-- Estatísticas por Time
CREATE TABLE team_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT,
    team VARCHAR(1),
    total_actions INT DEFAULT 0,
    scrums_won INT DEFAULT 0,
    lineouts_won INT DEFAULT 0,
    mauls_won INT DEFAULT 0,
    turnovers INT DEFAULT 0,
    tackles INT DEFAULT 0,
    carries INT DEFAULT 0,
    penalties_conceded INT DEFAULT 0,
    cards_received INT DEFAULT 0,
    points_estimated INT DEFAULT 0,
    possession_pct INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    UNIQUE KEY (match_id, team)
);

-- Avaliação Pós-Jogo (14 Rubros)
CREATE TABLE match_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT,
    evaluator_id INT,
    q1_score INT, q1_comment TEXT,
    q2_score INT, q2_comment TEXT,
    q3_score INT, q3_comment TEXT,
    q4_score INT, q4_comment TEXT,
    q5_score INT, q5_comment TEXT,
    q6_score INT, q6_comment TEXT,
    q7_score INT, q7_comment TEXT,
    q8_score INT, q8_comment TEXT,
    q9_score INT, q9_comment TEXT,
    q10_score INT, q10_comment TEXT,
    q11_score INT, q11_comment TEXT,
    q12_score INT, q12_comment TEXT,
    q13_score INT, q13_comment TEXT,
    q14_score INT, q14_comment TEXT,
    closing_feedback TEXT,
    average_score DECIMAL(3,1) GENERATED ALWAYS AS
        ((q1_score+q2_score+q3_score+q4_score+q5_score+q6_score+q7_score+q8_score+q9_score+q10_score+q11_score+q12_score+q13_score+q14_score)/14) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

-- Usuários e Controle de Acesso
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    role ENUM('referee', 'analyst', 'evaluator', 'admin'),
    team_id INT,
    club_affiliation VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100),
    short_name VARCHAR(3),
    club_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 Endpoints Principais

### Autenticação
```
POST /api/auth/login
  Body: { email, password }
  Response: { token, user, permissions }

POST /api/auth/logout
  Header: Authorization: Bearer {token}
```

### Partidas
```
POST /api/matches
  Body: { competition, homeTeam, awayTeam, referee_id, evaluator_id }
  Response: { match_id, match_uuid, status }

GET /api/matches/{id}
  Response: { match_data, events[], team_stats, evaluation }

PUT /api/matches/{id}/start
  Body: { match_time: "00:00" }

PUT /api/matches/{id}/end
  Body: { final_score_home, final_score_away }
```

### Eventos (Real-time)
```
POST /api/matches/{id}/events
  Body: {
    event_type, team, player, game_time,
    referee_comment, high_impact, card_type
  }
  Response: { event_id, created_at }

GET /api/matches/{id}/events?team=A&type=penalty
  Response: { events[], count }

DELETE /api/matches/{id}/events/{event_id}
  (Apenas árbitro/avaliador pode deletar)
```

### Estatísticas
```
POST /api/analytics/teams/{teamId}/stats
  Body: {
    match_id, action_type, outcome,
    player_number, field_zone
  }

GET /api/matches/{id}/analytics
  Response: {
    possessionPct, scrumWinPct, lineoutWinPct,
    turnovers, tackles, carries, penalties, cards
  }
```

### Avaliações
```
POST /api/matches/{id}/evaluation
  Body: {
    evaluator_id,
    scores: [q1_score, q2_score, ...],
    comments: [q1_comment, q2_comment, ...],
    closing_feedback
  }
  Response: { average_score, status: "completed" }

GET /api/matches/{id}/evaluation
```

### Exportação
```
GET /api/matches/{id}/export/pdf
  Response: Binary PDF Stream
  Headers: { "Content-Type": "application/pdf" }

GET /api/matches/{id}/export/json
  Response: { match_complete_data }

GET /api/matches/{id}/export/csv?include=timeline,stats
  Response: CSV Stream
```

## 🔐 Hierarquia de Permissões

```
┌──────────────────────────────────────┐
│          ÁRBITRO PRINCIPAL           │
├──────────────────────────────────────┤
│ • Criar súmula (POST /matches)       │
│ • Registrar eventos durante jogo     │
│ • Editar comentários arbitrais       │
│ • Visualizar análise final           │
│ • Exportar PDF assinado              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    ANALISTA DE VÍDEO (Time A/B)      │
├──────────────────────────────────────┤
│ • Preencher estatísticas seu time    │
│ • Visualizar dados próprios          │
│ • NÃO pode editar eventos árbitro    │
│ • NÃO pode acessar outro time        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         AVALIADOR/COACH               │
├──────────────────────────────────────┤
│ • Visualizar TODOS os dados          │
│ • Preencher 14 rubros pós-jogo       │
│ • Gerar relatórios finais            │
│ • Aceitar/Rejeitar eventos API       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│             ADMIN                    │
├──────────────────────────────────────┤
│ • Gerenciar usuários                 │
│ • Configurar competições             │
│ • Auditar logs                       │
│ • Backup/Export completo             │
└──────────────────────────────────────┘
```

## 🚀 Implementação de PDF (Súmula)

Usando `pdfkit`:

```javascript
// services/pdfService.js
const PDFDocument = require('pdfkit');

exports.generateSummaryPDF = async (matchId, db) => {
  const match = await db.query(
    `SELECT * FROM matches WHERE id = ?`, [matchId]
  );

  const doc = new PDFDocument();

  // Cabeçalho
  doc.fontSize(16).text('RUGBY MATCH SUMMARY', { align: 'center' });
  doc.fontSize(10).text(match.competition_name);

  // Dados Pré-Jogo
  doc.text(`${match.home_team} vs ${match.away_team}`);
  doc.text(`Date: ${match.match_date}`);
  doc.text(`Referee: ${match.referee_name}`);

  // Timeline (eventos)
  const events = await db.query(
    `SELECT * FROM match_events WHERE match_id = ? ORDER BY game_time`,
    [matchId]
  );

  doc.text('\nGAME TIMELINE:');
  events.forEach(ev => {
    doc.text(
      `${ev.game_time} - ${ev.event_type.toUpperCase()} ` +
      `(${ev.team}) #${ev.player_number} - ${ev.referee_comment}`
    );
  });

  // Assinatura digital
  doc.text('\nEvaluator: _______________');
  doc.text('Date: ' + new Date().toLocaleDateString());

  return doc;
};
```

## 🔄 Sincronização em Tempo Real (Webhooks)

```javascript
// Quando um evento é criado no MySQL
app.post('/api/matches/:id/events', async (req, res) => {
  const event = await eventController.create(req);

  // Notifica Firebase Realtime DB
  await firebaseService.updateMatchTimeline(
    req.params.id,
    event
  );

  // Notifica todos os analistas de vídeo conectados
  io.to(`match-${req.params.id}`).emit('eventCreated', event);

  res.json(event);
});
```

## 📊 Dashboard Integrado (Consolidação)

```javascript
// GET /api/matches/{id}/dashboard
exports.getDashboard = async (req, res) => {
  const matchId = req.params.id;

  // Dados do árbitro
  const refereeEvents = await db.query(
    `SELECT * FROM match_events WHERE match_id = ? AND created_by = ?`,
    [matchId, req.user.id]
  );

  // Dados dos analistas
  const teamStats = await db.query(
    `SELECT * FROM team_stats WHERE match_id = ?`,
    [matchId]
  );

  // IA Analysis (Gemini)
  const aiAnalysis = await geminiService.analyzeMatch({
    refereeEvents,
    teamStats
  });

  res.json({
    referee: { events: refereeEvents },
    analytics: teamStats,
    ai: aiAnalysis,
    consolidated: true
  });
};
```

## 🎯 Implementação Prioritária

**Phase 1 (Sprint 1-2):**
- [ ] Setup Express + MySQL
- [ ] CRUD básico de Matches e Events
- [ ] JWT Authentication
- [ ] POST /events endpoint

**Phase 2 (Sprint 3-4):**
- [ ] Firebase Realtime sync
- [ ] Analytics endpoints
- [ ] PDF export com pdfkit
- [ ] Charts.js integration

**Phase 3 (Sprint 5-6):**
- [ ] Gemini IA integration
- [ ] Evaluation form (14 rubros)
- [ ] Admin dashboard
- [ ] Role-based access control

**Phase 4 (Sprint 7-8):**
- [ ] Mobile React app
- [ ] Real-time sync WebSockets
- [ ] Performance optimization
- [ ] Deploy production (Docker)

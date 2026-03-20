/**
 * SERVIDOR UNIFICADO - RUGBY ANALYTICS ECOSYSTEM
 * Integra Árbitro, Analistas e Avaliador em uma única API REST
 *
 * Port: 3001
 * Uso: node server.js
 */

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jwt-simple');
const PDFDocument = require('pdfkit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Pool de Conexões MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'rugby_control',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Google Generative AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ============================================
// JWT MIDDLEWARE
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'rugby-secret-key-2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.decode(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ============================================
// AUTENTICAÇÃO
// ============================================

/**
 * POST /api/auth/login
 * Emite um JWT token para o usuário
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    // Busca usuário (em produção, usar bcrypt para senha)
    const [users] = await connection.query(
      'SELECT id, email, full_name, role FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const token = jwt.encode(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MATCHES - Criação e Gerenciamento
// ============================================

/**
 * POST /api/matches
 * Cria nova partida (apenas árbitro ou admin)
 */
app.post('/api/matches', authenticateToken, async (req, res) => {
  try {
    if (!['referee', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
      competition,
      homeTeam,
      awayTeam,
      matchDate,
      homeTeamId,
      awayTeamId,
      evaluatorId
    } = req.body;

    const connection = await pool.getConnection();
    const matchUuid = require('crypto').randomUUID();

    const [result] = await connection.query(
      `INSERT INTO matches
       (match_uuid, competition_id, home_team, away_team, match_date, referee_id, evaluator_id, status, match_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'setup', ?)`,
      [
        matchUuid,
        1, // competition_id - pode ser dinâmico
        homeTeam,
        awayTeam,
        matchDate || new Date(),
        req.user.id,
        evaluatorId,
        JSON.stringify({
          homeTeam, awayTeam, competition,
          createdAt: new Date().toISOString(),
          homeTeamId, awayTeamId
        })
      ]
    );

    connection.release();

    res.status(201).json({
      matchId: result.insertId,
      matchUuid,
      status: 'created',
      message: 'Match created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/matches/:id
 * Retorna dados consolidados da partida
 */
app.get('/api/matches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    // Dados principais
    const [matches] = await connection.query(
      'SELECT * FROM matches WHERE id = ?',
      [id]
    );

    if (matches.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matches[0];

    // Eventos (Timeline)
    const [events] = await connection.query(
      'SELECT * FROM match_events WHERE match_id = ? ORDER BY game_time ASC',
      [id]
    );

    // Estatísticas por Time
    const [stats] = await connection.query(
      'SELECT * FROM team_stats WHERE match_id = ?',
      [id]
    );

    // Avaliação (se existir)
    const [evaluations] = await connection.query(
      'SELECT * FROM match_evaluations WHERE match_id = ?',
      [id]
    );

    connection.release();

    res.json({
      match,
      events,
      statistics: stats,
      evaluation: evaluations.length > 0 ? evaluations[0] : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EVENTOS - Árbitro registra ações
// ============================================

/**
 * POST /api/matches/:id/events
 * Registra novo evento durante a partida
 */
app.post('/api/matches/:id/events', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      eventType,
      team,
      playerNumber,
      gameTime,
      refereeComment,
      highImpact,
      cardType,
      fieldZone
    } = req.body;

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      `INSERT INTO match_events
       (match_id, event_uuid, event_type, team, player_number, game_time,
        timestamp_exact, referee_comment, high_impact, card_type, created_by, field_zone)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [
        id,
        require('crypto').randomUUID(),
        eventType,
        team,
        playerNumber,
        gameTime,
        refereeComment,
        highImpact ? 1 : 0,
        cardType || null,
        req.user.id,
        fieldZone || 'Midfield'
      ]
    );

    // Atualiza timestamp exato para Firebase sync
    const eventId = result.insertId;

    connection.release();

    res.status(201).json({
      eventId,
      matchId: id,
      message: 'Event recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/matches/:id/events/:eventId
 * Deleta evento (apenas árbitro/avaliador)
 */
app.delete('/api/matches/:id/events/:eventId', authenticateToken, async (req, res) => {
  try {
    if (!['referee', 'evaluator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized to delete events' });
    }

    const { id, eventId } = req.params;
    const connection = await pool.getConnection();

    await connection.query(
      'DELETE FROM match_events WHERE id = ? AND match_id = ?',
      [eventId, id]
    );

    connection.release();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ANALYTICS - Analistas de vídeo registram dados
// ============================================

/**
 * POST /api/analytics/teams/:teamId/stats
 * Registra estatísticas do time
 */
app.post('/api/analytics/teams/:teamId/stats', authenticateToken, async (req, res) => {
  try {
    // Apenas analista do próprio time ou admin pode postar
    if (req.user.role === 'analyst' && req.user.teamId !== parseInt(req.params.teamId)) {
      return res.status(403).json({ error: 'Cannot access other team data' });
    }

    const {
      matchId,
      actionType,
      outcome,
      playerNumber,
      fieldZone
    } = req.body;

    const connection = await pool.getConnection();

    // Registra evento de estatística
    const [result] = await connection.query(
      `INSERT INTO match_events
       (match_id, event_uuid, event_type, team, player_number,
        timestamp_exact, created_by, field_zone)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        matchId,
        require('crypto').randomUUID(),
        actionType,
        req.user.teamId === parseInt(req.params.teamId) ? 'A' : 'B',
        playerNumber,
        req.user.id,
        fieldZone || 'Midfield'
      ]
    );

    // Atualiza agregações em team_stats
    const team = req.user.teamId === parseInt(req.params.teamId) ? 'A' : 'B';
    await updateTeamStats(connection, matchId, team);

    connection.release();

    res.status(201).json({
      message: 'Team statistics updated',
      eventType: actionType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/matches/:id/analytics
 * Retorna estatísticas consolidadas
 */
app.get('/api/matches/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [stats] = await connection.query(
      'SELECT * FROM team_stats WHERE match_id = ?',
      [req.params.id]
    );

    connection.release();

    // Calcula percentuais
    const result = stats.map(s => ({
      ...s,
      scrumWinPct: s.scrums_won > 0 ? Math.round((s.scrums_won / 5) * 100) : 0,
      lineoutWinPct: s.lineouts_won > 0 ? Math.round((s.lineouts_won / 5) * 100) : 0,
      maulSuccessPct: s.mauls_won > 0 ? Math.round((s.mauls_won / 3) * 100) : 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AVALIAÇÕES - Pós-jogo (14 rubros)
// ============================================

/**
 * POST /api/matches/:id/evaluation
 * Registra avaliação completa pós-jogo
 */
app.post('/api/matches/:id/evaluation', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'evaluator' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only evaluators can submit evaluations' });
    }

    const { id } = req.params;
    const {
      scores,      // Array de 14 notas
      comments,    // Array de 14 comentários
      closingFeedback
    } = req.body;

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      `INSERT INTO match_evaluations
       (match_id, evaluator_id,
        q1_score, q1_comment, q2_score, q2_comment,
        q3_score, q3_comment, q4_score, q4_comment,
        q5_score, q5_comment, q6_score, q6_comment,
        q7_score, q7_comment, q8_score, q8_comment,
        q9_score, q9_comment, q10_score, q10_comment,
        q11_score, q11_comment, q12_score, q12_comment,
        q13_score, q13_comment, q14_score, q14_comment,
        closing_feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.user.id,
        ...[...Array(14)].flatMap((_, i) => [
          scores[i] || 5,
          comments[i] || ''
        ]),
        closingFeedback || ''
      ]
    );

    // Marca partida como 'finished'
    await connection.query(
      'UPDATE matches SET status = ? WHERE id = ?',
      ['finished', id]
    );

    connection.release();

    res.status(201).json({
      evaluationId: result.insertId,
      message: 'Evaluation submitted successfully',
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / 14 * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/matches/:id/evaluation
 */
app.get('/api/matches/:id/evaluation', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [evals] = await connection.query(
      'SELECT * FROM match_evaluations WHERE match_id = ?',
      [req.params.id]
    );
    connection.release();

    if (evals.length === 0) {
      return res.status(404).json({ error: 'No evaluation found' });
    }

    res.json(evals[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXPORTAÇÃO - PDF, JSON, CSV
// ============================================

/**
 * GET /api/matches/:id/export/pdf
 * Gera súmula em PDF
 */
app.get('/api/matches/:id/export/pdf', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [matches] = await connection.query('SELECT * FROM matches WHERE id = ?', [id]);
    const [events] = await connection.query(
      'SELECT * FROM match_events WHERE match_id = ? ORDER BY game_time',
      [id]
    );
    const [evaluation] = await connection.query(
      'SELECT * FROM match_evaluations WHERE match_id = ?',
      [id]
    );

    connection.release();

    if (matches.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matches[0];
    const doc = new PDFDocument();

    // Headers
    doc.fontSize(20).text('RUGBY MATCH SUMMARY', { align: 'center' });
    doc.fontSize(12).text(match.competition_id ? 'Competição' : 'Match', { align: 'center' });
    doc.moveDown();

    // Match Info
    doc.fontSize(10)
      .text(`Match: ${match.home_team} vs ${match.away_team}`)
      .text(`Date: ${match.match_date}`)
      .text(`Referee: ${req.user.fullName || 'Not specified'}`)
      .moveDown();

    // Timeline
    doc.fontSize(12).text('GAME TIMELINE:');
    events.forEach(ev => {
      doc.fontSize(9)
        .text(`${ev.game_time} - ${ev.event_type.toUpperCase()} (Team ${ev.team}) #${ev.player_number}`);
      if (ev.referee_comment) {
        doc.fontSize(8).text(`  → ${ev.referee_comment}`, { indent: 20 });
      }
    });

    // Evaluation
    if (evaluation.length > 0) {
      doc.moveDown().fontSize(12).text('POST-MATCH EVALUATION:');
      const eval_data = evaluation[0];
      doc.fontSize(9)
        .text(`Average Score: ${eval_data.average_score}/10`)
        .text(`Feedback: ${eval_data.closing_feedback || 'No feedback'}`);
    }

    // Assinatura
    doc.moveDown(3).fontSize(10)
      .text('Evaluator Signature: ________________  Date: ________________');

    // Stream PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="match-${id}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/matches/:id/export/json
 */
app.get('/api/matches/:id/export/json', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [match] = await connection.query('SELECT * FROM matches WHERE id = ?', [req.params.id]);
    const [events] = await connection.query(
      'SELECT * FROM match_events WHERE match_id = ?',
      [req.params.id]
    );
    const [stats] = await connection.query(
      'SELECT * FROM team_stats WHERE match_id = ?',
      [req.params.id]
    );
    const [evaluation] = await connection.query(
      'SELECT * FROM match_evaluations WHERE match_id = ?',
      [req.params.id]
    );

    connection.release();

    res.json({
      match: match[0],
      events,
      statistics: stats,
      evaluation: evaluation.length > 0 ? evaluation[0] : null,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// IA - GEMINI ANALYSIS (Integração com Análise de Rugby Pro)
// ============================================

/**
 * POST /api/matches/:id/ai-analysis
 * Gera análise de IA baseada em eventos
 */
app.post('/api/matches/:id/ai-analysis', authenticateToken, async (req, res) => {
  try {
    const { analysisType } = req.body; // 'discipline', 'referee', 'training'
    const matchId = req.params.id;

    const connection = await pool.getConnection();
    const [events] = await connection.query(
      'SELECT * FROM match_events WHERE match_id = ?',
      [matchId]
    );
    const [stats] = await connection.query(
      'SELECT * FROM team_stats WHERE match_id = ?',
      [matchId]
    );
    connection.release();

    // Monta o prompt para Gemini
    let prompt = '';
    if (analysisType === 'discipline') {
      prompt = `Analyze the following rugby match infractions and provide a disciplinary report:\n${JSON.stringify(events, null, 2)}`;
    } else if (analysisType === 'referee') {
      prompt = `Evaluate the referee's performance based on these events:\n${JSON.stringify(events, null, 2)}\nProvide constructive feedback.`;
    } else if (analysisType === 'training') {
      prompt = `Based on these match events and statistics, suggest 2 training exercises to improve performance:\n${JSON.stringify(stats, null, 2)}`;
    }

    // Chama Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);

    res.json({
      analysisType,
      result: result.response.text(),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HELPERS
// ============================================

/**
 * Atualiza estatísticas agregadas do time
 */
async function updateTeamStats(connection, matchId, team) {
  const [events] = await connection.query(
    `SELECT event_type, outcome_modifier FROM match_events
     WHERE match_id = ? AND team = ?`,
    [matchId, team]
  );

  let scrumWon = 0, lineoutWon = 0, maulWon = 0, turnovers = 0, tackles = 0, carries = 0;

  events.forEach(ev => {
    if (ev.event_type === 'Scrum' && ev.outcome_modifier === 'Won') scrumWon++;
    if (ev.event_type === 'Lineout' && ev.outcome_modifier === 'Won') lineoutWon++;
    if (ev.event_type === 'Maul' && ev.outcome_modifier === 'Won') maulWon++;
    if (ev.event_type === 'Turnover' && ev.outcome_modifier?.includes('Won')) turnovers++;
    if (ev.event_type === 'Tackle') tackles++;
    if (ev.event_type === 'Ball Carry') carries++;
  });

  await connection.query(
    `INSERT INTO team_stats (match_id, team, scrums_won, lineouts_won, mauls_won, turnovers, tackles, carries, total_actions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     scrums_won = ?, lineouts_won = ?, mauls_won = ?, turnovers = ?, tackles = ?, carries = ?, total_actions = ?`,
    [
      matchId, team, scrumWon, lineoutWon, maulWon, turnovers, tackles, carries, events.length,
      scrumWon, lineoutWon, maulWon, turnovers, tackles, carries, events.length
    ]
  );
}

// ============================================
// INICIALIZAÇÃO
// ============================================

app.listen(PORT, () => {
  console.log(`🏉 Rugby Analytics Server running on port ${PORT}`);
  console.log('Endpoints:');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/matches');
  console.log('  GET    /api/matches/:id');
  console.log('  POST   /api/matches/:id/events');
  console.log('  POST   /api/analytics/teams/:teamId/stats');
  console.log('  POST   /api/matches/:id/evaluation');
  console.log('  GET    /api/matches/:id/export/pdf');
  console.log('  POST   /api/matches/:id/ai-analysis');
});

module.exports = app;

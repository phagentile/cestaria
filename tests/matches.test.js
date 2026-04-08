/**
 * Match Management Tests
 * Tests for /api/matches endpoints (CRUD operations)
 */

const request = require('supertest');
const app = require('../server');

describe('Match Management Endpoints', () => {
  let token = '';
  let matchId = null;
  let matchUuid = null;

  // Setup: Get a valid auth token before tests
  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'referee@club.com',
        password: 'password123'
      });

    token = loginResponse.body.token;
  });

  describe('POST /api/matches - Create Match', () => {
    test('should create a new match with UUID', async () => {
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${token}`)
        .send({
          competition: 'Super 12 2026',
          homeTeam: 'Jacareí',
          awayTeam: 'Iguanas',
          matchDate: '2026-03-20T14:00:00Z',
          evaluatorId: 4
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('matchId');
      expect(response.body).toHaveProperty('matchUuid');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('setup');

      // Save for later tests
      matchId = response.body.matchId;
      matchUuid = response.body.matchUuid;
    });

    test('should generate valid UUID format', async () => {
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${token}`)
        .send({
          competition: 'Super 12 2026',
          homeTeam: 'Jacareí',
          awayTeam: 'Iguanas',
          matchDate: '2026-03-20T14:00:00Z'
        });

      expect(response.status).toBe(201);
      // UUID format: 8-4-4-4-12 hex characters
      expect(response.body.matchUuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/matches')
        .send({
          competition: 'Super 12 2026',
          homeTeam: 'Jacareí',
          awayTeam: 'Iguanas'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/:id - Get Match Details', () => {
    test('should return match data for valid ID', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('match_uuid');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('created_at');
    });

    test('should include team information', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('home_team_id');
      expect(response.body).toHaveProperty('away_team_id');
    });

    test('should return 404 for non-existent match', async () => {
      const response = await request(app)
        .get('/api/matches/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches - List All Matches', () => {
    test('should return list of matches', async () => {
      const response = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should include pagination metadata', async () => {
      const response = await request(app)
        .get('/api/matches?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    test('should filter matches by status', async () => {
      const response = await request(app)
        .get('/api/matches?status=setup')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/matches/:id/start - Start Match', () => {
    test('should transition match to live status', async () => {
      const response = await request(app)
        .put(`/api/matches/${matchId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          match_time: '00:00'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('live');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/matches/${matchId}/start`)
        .send({
          match_time: '00:00'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/matches/:id/end - Finish Match', () => {
    test('should transition match to finished status', async () => {
      const response = await request(app)
        .put(`/api/matches/${matchId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          final_score_home: 21,
          final_score_away: 14
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('finished');
    });

    test('should store final scores', async () => {
      const response = await request(app)
        .put(`/api/matches/${matchId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          final_score_home: 21,
          final_score_away: 14
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('match_data');
      expect(response.body.match_data.final_score_home).toBe(21);
      expect(response.body.match_data.final_score_away).toBe(14);
    });
  });

  describe('Match Status Transitions', () => {
    test('should follow correct status flow: setup -> live -> finished -> consolidated', async () => {
      // Create a new match
      const createResponse = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${token}`)
        .send({
          competition: 'Super 12 2026',
          homeTeam: 'Team A',
          awayTeam: 'Team B'
        });

      const newMatchId = createResponse.body.matchId;

      // Verify initial status is 'setup'
      let getResponse = await request(app)
        .get(`/api/matches/${newMatchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getResponse.body.status).toBe('setup');

      // Start match
      await request(app)
        .put(`/api/matches/${newMatchId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .send({ match_time: '00:00' });

      getResponse = await request(app)
        .get(`/api/matches/${newMatchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getResponse.body.status).toBe('live');

      // End match
      await request(app)
        .put(`/api/matches/${newMatchId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({ final_score_home: 21, final_score_away: 14 });

      getResponse = await request(app)
        .get(`/api/matches/${newMatchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getResponse.body.status).toBe('finished');
    });
  });
});

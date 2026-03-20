/**
 * Analytics and Team Statistics Tests
 * Tests for team statistics aggregation endpoints
 */

const request = require('supertest');
const app = require('../server');

describe('Analytics Endpoints', () => {
  let token = '';
  let analystAToken = '';
  let analystBToken = '';
  let matchId = 1;
  let teamAId = 1;
  let teamBId = 2;

  beforeAll(async () => {
    const refereeLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'referee@club.com',
        password: 'password123'
      });

    token = refereeLogin.body.token;

    const analystALogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'analyst-a@club.com',
        password: 'password123'
      });

    analystAToken = analystALogin.body.token;

    const analystBLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'analyst-b@club.com',
        password: 'password123'
      });

    analystBToken = analystBLogin.body.token;
  });

  describe('POST /api/analytics/teams/:teamId/stats - Submit Team Statistics', () => {
    test('should create aggregated stats for team', async () => {
      const response = await request(app)
        .post(`/api/analytics/teams/${teamAId}/stats`)
        .set('Authorization', `Bearer ${analystAToken}`)
        .send({
          matchId: matchId,
          actionType: 'Scrum',
          outcome: 'Won',
          playerNumber: '1-3',
          fieldZone: 'Attacking 22'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('teamStatsId');
      expect(response.body).toHaveProperty('aggregatedStats');
    });

    test('should calculate totals automatically', async () => {
      // Submit multiple stats
      await request(app)
        .post(`/api/analytics/teams/${teamAId}/stats`)
        .set('Authorization', `Bearer ${analystAToken}`)
        .send({
          matchId: matchId,
          actionType: 'Tackle',
          outcome: 'Successful',
          playerNumber: '7',
          quantity: 5
        });

      await request(app)
        .post(`/api/analytics/teams/${teamAId}/stats`)
        .set('Authorization', `Bearer ${analystAToken}`)
        .send({
          matchId: matchId,
          actionType: 'Tackle',
          outcome: 'Successful',
          playerNumber: '8',
          quantity: 3
        });

      // Get aggregated stats
      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('team_a_stats');
      expect(response.body.team_a_stats).toHaveProperty('total_actions');
      expect(response.body.team_a_stats).toHaveProperty('tackles');
    });

    test('should calculate percentages (possession, win rates)', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      if (response.body.team_a_stats) {
        expect(response.body.team_a_stats).toHaveProperty('possession_pct');
        expect(response.body.team_a_stats.possession_pct).toBeGreaterThanOrEqual(0);
        expect(response.body.team_a_stats.possession_pct).toBeLessThanOrEqual(100);
      }
    });

    test('should support all action types', async () => {
      const actionTypes = [
        'Scrum', 'Lineout', 'Maul', 'Ruck', 'Carry', 'Tackle',
        'Penalty Conceded', 'Card', 'Try', 'Conversion', 'Drop Goal'
      ];

      for (const actionType of actionTypes) {
        const response = await request(app)
          .post(`/api/analytics/teams/${teamAId}/stats`)
          .set('Authorization', `Bearer ${analystAToken}`)
          .send({
            matchId: matchId,
            actionType: actionType,
            outcome: 'Successful',
            playerNumber: '1'
          });

        expect(response.status).toBe(201);
      }
    });

    test('should require analyst to be on the team', async () => {
      // Analyst A tries to submit stats for Team B
      const response = await request(app)
        .post(`/api/analytics/teams/${teamBId}/stats`)
        .set('Authorization', `Bearer ${analystAToken}`)
        .send({
          matchId: matchId,
          actionType: 'Scrum',
          outcome: 'Won',
          playerNumber: '1'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should allow analyst to only see own team stats', async () => {
      // Analyst A can see Team A stats
      const responseA = await request(app)
        .get(`/api/matches/${matchId}/analytics?team=A`)
        .set('Authorization', `Bearer ${analystAToken}`);

      expect(responseA.status).toBe(200);

      // Analyst A cannot see Team B stats
      const responseB = await request(app)
        .get(`/api/matches/${matchId}/analytics?team=B`)
        .set('Authorization', `Bearer ${analystAToken}`);

      expect(responseB.status).toBe(403);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/analytics/teams/${teamAId}/stats`)
        .send({
          matchId: matchId,
          actionType: 'Scrum',
          outcome: 'Won',
          playerNumber: '1'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/:id/analytics - Get Consolidated Analytics', () => {
    test('should return consolidated stats for both teams', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('team_a_stats');
      expect(response.body).toHaveProperty('team_b_stats');
    });

    test('should include all aggregate fields', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      if (response.body.team_a_stats) {
        const stats = response.body.team_a_stats;
        expect(stats).toHaveProperty('total_actions');
        expect(stats).toHaveProperty('scrums_won');
        expect(stats).toHaveProperty('lineouts_won');
        expect(stats).toHaveProperty('mauls_won');
        expect(stats).toHaveProperty('turnovers');
        expect(stats).toHaveProperty('tackles');
        expect(stats).toHaveProperty('carries');
        expect(stats).toHaveProperty('penalties_conceded');
        expect(stats).toHaveProperty('cards_received');
        expect(stats).toHaveProperty('points_estimated');
        expect(stats).toHaveProperty('possession_pct');
      }
    });

    test('should return 404 for non-existent match', async () => {
      const response = await request(app)
        .get('/api/matches/99999/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`);

      expect(response.status).toBe(401);
    });

    test('analyst sees only own team analytics', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`)
        .set('Authorization', `Bearer ${analystAToken}`);

      // Analyst should get 200, but see only their team data
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('team_a_stats');
      // Team B stats might be null or missing for analyst
      if (response.body.team_b_stats) {
        expect(response.body.team_b_stats).toBeNull();
      }
    });

    test('evaluator sees all team analytics', async () => {
      const evaluatorLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'evaluator@club.com',
          password: 'password123'
        });

      const evaluatorToken = evaluatorLogin.body.token;

      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('team_a_stats');
      expect(response.body).toHaveProperty('team_b_stats');
    });
  });

  describe('Analytics Calculations', () => {
    test('should calculate possession percentage correctly', async () => {
      // Assuming team A has 60 actions, team B has 40 actions
      // Possession should be ~60% for A, ~40% for B
      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const statsA = response.body.team_a_stats;
      const statsB = response.body.team_b_stats;

      if (statsA && statsB) {
        const totalActions = statsA.total_actions + statsB.total_actions;
        const expectedPossA = (statsA.total_actions / totalActions) * 100;
        expect(Math.abs(statsA.possession_pct - expectedPossA)).toBeLessThan(1); // Within 1%
      }
    });

    test('should track scrum wins percentage', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      if (response.body.team_a_stats) {
        const stats = response.body.team_a_stats;
        // Should have scrum_win_pct if any scrums recorded
        if (stats.scrums_won > 0) {
          expect(stats).toHaveProperty('scrum_win_pct');
        }
      }
    });
  });
});

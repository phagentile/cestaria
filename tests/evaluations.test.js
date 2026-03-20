/**
 * Match Evaluation Tests
 * Tests for 14-rubric evaluation form and scoring system
 */

const request = require('supertest');
const app = require('../server');

describe('Evaluation Endpoints', () => {
  let evaluatorToken = '';
  let matchId = 1;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'evaluator@club.com',
        password: 'password123'
      });

    evaluatorToken = login.body.token;
  });

  describe('POST /api/matches/:id/evaluation - Submit Evaluation', () => {
    test('should accept 14 rubric scores (1-10)', async () => {
      const scores = [8, 9, 7, 8, 9, 8, 7, 8, 9, 8, 7, 8, 9, 8];
      const comments = Array(14).fill('Good performance');

      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: scores,
          comments: comments,
          closingFeedback: 'Excellent match overall'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('evaluationId');
      expect(response.body).toHaveProperty('averageScore');
    });

    test('should calculate average score automatically', async () => {
      const scores = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
      const comments = Array(14).fill('Perfect');

      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: scores,
          comments: comments,
          closingFeedback: 'Perfect evaluation'
        });

      expect(response.status).toBe(201);
      expect(response.body.averageScore).toBe(10.0);
    });

    test('should validate score range (1-10)', async () => {
      const invalidScores = [0, 11, -1, 15]; // Out of range

      for (const invalidScore of invalidScores) {
        const scores = [invalidScore, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
        const response = await request(app)
          .post(`/api/matches/${matchId}/evaluation`)
          .set('Authorization', `Bearer ${evaluatorToken}`)
          .send({
            scores: scores,
            comments: Array(14).fill('Test')
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    test('should require exactly 14 scores', async () => {
      const shortScores = [8, 9, 7, 8, 9, 8, 7, 8, 9, 8, 7, 8]; // Only 12

      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: shortScores,
          comments: Array(14).fill('Test')
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('14');
    });

    test('should accept optional closing feedback', async () => {
      const scores = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
      const feedback = 'This referee demonstrated excellent game management and communication throughout the match.';

      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: scores,
          comments: Array(14).fill('Good'),
          closingFeedback: feedback
        });

      expect(response.status).toBe(201);
      expect(response.body.closingFeedback).toBe(feedback);
    });

    test('should only allow evaluator role', async () => {
      const refereeLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'referee@club.com',
          password: 'password123'
        });

      const refereeToken = refereeLogin.body.token;

      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${refereeToken}`)
        .send({
          scores: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
          comments: Array(14).fill('Test')
        });

      expect(response.status).toBe(403);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .send({
          scores: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
          comments: Array(14).fill('Test')
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/:id/evaluation - Retrieve Evaluation', () => {
    test('should return stored evaluation', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('evaluationId');
      expect(response.body).toHaveProperty('averageScore');
    });

    test('should include all 14 scores', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      for (let i = 1; i <= 14; i++) {
        expect(response.body).toHaveProperty(`q${i}_score`);
      }
    });

    test('should include all 14 comments', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      for (let i = 1; i <= 14; i++) {
        expect(response.body).toHaveProperty(`q${i}_comment`);
      }
    });

    test('should include closing feedback', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('closingFeedback');
    });

    test('should return 404 if no evaluation exists', async () => {
      // Create new match without evaluation
      const matchResponse = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          competition: 'Test',
          homeTeam: 'Team A',
          awayTeam: 'Team B'
        });

      const newMatchId = matchResponse.body.matchId;

      const response = await request(app)
        .get(`/api/matches/${newMatchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/evaluation`);

      expect(response.status).toBe(401);
    });

    test('should allow only evaluator to retrieve', async () => {
      const analystLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'analyst-a@club.com',
          password: 'password123'
        });

      const analystToken = analystLogin.body.token;

      const response = await request(app)
        .get(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Evaluation Scoring', () => {
    test('should calculate average of all 14 scores', async () => {
      const scores = [6, 7, 8, 9, 10, 5, 6, 7, 8, 9, 7, 7, 7, 8];
      const expected = scores.reduce((a, b) => a + b, 0) / scores.length;

      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: scores,
          comments: Array(14).fill('Test')
        });

      expect(response.status).toBe(201);
      expect(response.body.averageScore).toBeCloseTo(expected, 1);
    });

    test('should handle minimum scores (all 1s)', async () => {
      const scores = Array(14).fill(1);

      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: scores,
          comments: Array(14).fill('Poor')
        });

      expect(response.status).toBe(201);
      expect(response.body.averageScore).toBe(1.0);
    });

    test('should handle maximum scores (all 10s)', async () => {
      const scores = Array(14).fill(10);

      const response = await request(app)
        .post(`/api/matches/${matchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: scores,
          comments: Array(14).fill('Excellent')
        });

      expect(response.status).toBe(201);
      expect(response.body.averageScore).toBe(10.0);
    });
  });

  describe('Evaluation Workflow', () => {
    test('should update match status to consolidated after evaluation', async () => {
      // Create match
      const matchResponse = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          competition: 'Test',
          homeTeam: 'Team A',
          awayTeam: 'Team B'
        });

      const newMatchId = matchResponse.body.matchId;

      // Submit evaluation
      await request(app)
        .post(`/api/matches/${newMatchId}/evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          scores: Array(14).fill(8),
          comments: Array(14).fill('Good')
        });

      // Check match status
      const getResponse = await request(app)
        .get(`/api/matches/${newMatchId}`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(getResponse.body.status).toBe('consolidated');
    });
  });
});

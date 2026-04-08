/**
 * AI Analysis Tests
 * Tests for Gemini AI integration and analysis endpoints
 */

const request = require('supertest');
const app = require('../server');

describe('AI Analysis Endpoints', () => {
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

  describe('POST /api/matches/:id/ai-analysis?type=discipline - Discipline Analysis', () => {
    test('should analyze infractions', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysis');
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toBe('discipline');
    });

    test('should identify penalty patterns', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('total_penalties');
      expect(response.body.analysis).toHaveProperty('penalties_by_team');
      expect(response.body.analysis).toHaveProperty('penalty_analysis');
    });

    test('should track card distributions', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('yellow_cards');
      expect(response.body.analysis).toHaveProperty('red_cards');
      expect(response.body.analysis).toHaveProperty('card_distribution');
    });

    test('should identify patterns and trends', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('patterns');
      expect(response.body.analysis).toHaveProperty('trends');
    });
  });

  describe('POST /api/matches/:id/ai-analysis?type=referee - Referee Performance Analysis', () => {
    test('should analyze referee performance', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=referee`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysis');
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toBe('referee');
    });

    test('should evaluate consistency', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=referee`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('consistency_score');
      expect(response.body.analysis).toHaveProperty('penalty_bias_analysis');
    });

    test('should assess communication quality', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=referee`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('decision_explanation_quality');
      expect(response.body.analysis).toHaveProperty('communication_clarity');
    });

    test('should provide performance recommendations', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=referee`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.analysis.recommendations)).toBe(true);
    });
  });

  describe('POST /api/matches/:id/ai-analysis?type=training - Training Suggestions', () => {
    test('should provide training suggestions', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=training`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysis');
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toBe('training');
    });

    test('should suggest improvement areas', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=training`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('improvement_areas');
      expect(Array.isArray(response.body.analysis.improvement_areas)).toBe(true);
    });

    test('should recommend focused training', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=training`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('training_recommendations');
      expect(Array.isArray(response.body.analysis.training_recommendations)).toBe(true);
    });

    test('should include resources and examples', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=training`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('resources');
      expect(response.body.analysis).toHaveProperty('example_scenarios');
    });
  });

  describe('AI Analysis Caching', () => {
    test('should cache results to avoid duplicate Gemini calls', async () => {
      // First call
      const response1 = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response1.status).toBe(200);
      const timestamp1 = response1.body.analyzedAt;

      // Second call - should return cached result
      const response2 = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response2.status).toBe(200);
      const timestamp2 = response2.body.analyzedAt;

      // Timestamps should be identical (same cached result)
      expect(timestamp1).toBe(timestamp2);
    });

    test('should have separate cache for different analysis types', async () => {
      const disciplineResponse = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      const refereeResponse = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=referee`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(disciplineResponse.status).toBe(200);
      expect(refereeResponse.status).toBe(200);

      // Different timestamps or at least different content
      expect(disciplineResponse.body.type).toBe('discipline');
      expect(refereeResponse.body.type).toBe('referee');
    });

    test('should allow forced refresh of analysis', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline&refresh=true`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toBeTruthy();
    });
  });

  describe('AI Analysis Permissions', () => {
    test('should only allow evaluator role', async () => {
      const refereeLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'referee@club.com',
          password: 'password123'
        });

      const refereeToken = refereeLogin.body.token;

      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${refereeToken}`);

      expect(response.status).toBe(403);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`);

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent match', async () => {
      const response = await request(app)
        .post('/api/matches/99999/ai-analysis?type=discipline')
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('AI Analysis Metadata', () => {
    test('should include analysis timestamp', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analyzedAt');
      expect(new Date(response.body.analyzedAt)).toBeInstanceOf(Date);
    });

    test('should include model version', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('model');
      expect(response.body.model).toMatch(/gemini/i);
    });

    test('should include confidence score', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('confidence');
      expect(response.body.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('AI Analysis Integration', () => {
    test('should reference match data in analysis', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analysis).toHaveProperty('total_events');
      expect(response.body.analysis).toHaveProperty('event_summary');
    });

    test('should correlate with match events', async () => {
      const eventsResponse = await request(app)
        .get(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      const analysisResponse = await request(app)
        .post(`/api/matches/${matchId}/ai-analysis?type=discipline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(analysisResponse.status).toBe(200);
      if (eventsResponse.body.length > 0) {
        expect(analysisResponse.body.analysis.total_events).toBe(eventsResponse.body.length);
      }
    });
  });
});

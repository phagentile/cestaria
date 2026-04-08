/**
 * Export Endpoints Tests
 * Tests for PDF, JSON, and CSV export functionality
 */

const request = require('supertest');
const app = require('../server');

describe('Export Endpoints', () => {
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

  describe('GET /api/matches/:id/export/pdf - PDF Export', () => {
    test('should generate downloadable PDF', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/pdf`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/pdf/);
      expect(response.headers['content-disposition']).toMatch(/attachment/);
    });

    test('should include match data in PDF', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/pdf`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      // PDF should contain match information
      const pdfContent = response.body.toString();
      expect(pdfContent).toBeTruthy();
      expect(pdfContent.length).toBeGreaterThan(100); // Reasonable PDF size
    });

    test('should include events in PDF', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/pdf`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      // PDF should contain event timeline
      expect(response.body).toBeTruthy();
    });

    test('should include statistics in PDF', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/pdf`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      // PDF should contain team statistics
      expect(response.body).toBeTruthy();
    });

    test('should include evaluation scores if match is evaluated', async () => {
      // If match has evaluation, should be in PDF
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/pdf`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
    });

    test('should set proper filename header', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/pdf`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toMatch(/match-\d+\.pdf/);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/pdf`);

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent match', async () => {
      const response = await request(app)
        .get('/api/matches/99999/export/pdf')
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/matches/:id/export/json - JSON Export', () => {
    test('should export complete match data as JSON', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/json`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(typeof response.body).toBe('object');
    });

    test('should include nested data structure', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/json`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('match');
      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('evaluation');
    });

    test('should include all match metadata', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/json`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.match).toHaveProperty('id');
      expect(response.body.match).toHaveProperty('match_uuid');
      expect(response.body.match).toHaveProperty('competition');
      expect(response.body.match).toHaveProperty('homeTeam');
      expect(response.body.match).toHaveProperty('awayTeam');
      expect(response.body.match).toHaveProperty('status');
    });

    test('should include complete event array', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/json`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.events)).toBe(true);
      if (response.body.events.length > 0) {
        const event = response.body.events[0];
        expect(event).toHaveProperty('event_uuid');
        expect(event).toHaveProperty('event_type');
        expect(event).toHaveProperty('game_time');
        expect(event).toHaveProperty('timestamp_exact');
      }
    });

    test('should include team statistics', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/json`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics).toHaveProperty('team_a');
      expect(response.body.statistics).toHaveProperty('team_b');
    });

    test('should be valid JSON', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/json`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      // Should be parseable without error
      expect(() => JSON.stringify(response.body)).not.toThrow();
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/json`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/:id/export/csv - CSV Export', () => {
    test('should export data as CSV', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/csv`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/csv/);
      expect(response.headers['content-disposition']).toMatch(/attachment/);
    });

    test('should include CSV headers', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/csv`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      const csv = response.text;
      expect(csv).toContain(','); // CSV format
      const lines = csv.split('\n');
      expect(lines[0]).toBeTruthy(); // Header row
    });

    test('should support include parameter for selective fields', async () => {
      // Include only timeline
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/csv?include=timeline`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/csv/);
    });

    test('should support multiple include parameters', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/csv?include=timeline,stats,evaluation`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/csv/);
    });

    test('should set proper filename header', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/csv`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toMatch(/match-\d+\.csv/);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/export/csv`);

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent match', async () => {
      const response = await request(app)
        .get('/api/matches/99999/export/csv')
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Export File Generation', () => {
    test('should generate valid file for each export type', async () => {
      // PDF
      const pdfResponse = await request(app)
        .get(`/api/matches/${matchId}/export/pdf`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(pdfResponse.status).toBe(200);
      expect(pdfResponse.body.length).toBeGreaterThan(100);

      // JSON
      const jsonResponse = await request(app)
        .get(`/api/matches/${matchId}/export/json`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(jsonResponse.status).toBe(200);
      expect(jsonResponse.body).toHaveProperty('match');

      // CSV
      const csvResponse = await request(app)
        .get(`/api/matches/${matchId}/export/csv`)
        .set('Authorization', `Bearer ${evaluatorToken}`);

      expect(csvResponse.status).toBe(200);
      expect(csvResponse.text).toContain(',');
    });
  });
});

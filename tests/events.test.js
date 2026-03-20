/**
 * Match Events Tests
 * Tests for event recording and timeline endpoints
 */

const request = require('supertest');
const app = require('../server');

describe('Match Events Endpoints', () => {
  let token = '';
  let matchId = 1;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'referee@club.com',
        password: 'password123'
      });

    token = loginResponse.body.token;
  });

  describe('POST /api/matches/:id/events - Create Event', () => {
    test('should create event with UUID and timestamp', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'penalty',
          team: 'A',
          playerNumber: '10',
          gameTime: '15:42',
          refereeComment: 'High tackle on #4',
          highImpact: true,
          fieldZone: 'Attacking 22'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('eventId');
      expect(response.body).toHaveProperty('eventUuid');
      expect(response.body).toHaveProperty('createdAt');
    });

    test('should include referee comments', async () => {
      const comment = 'High tackle on #4';
      const response = await request(app)
        .post(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'penalty',
          team: 'A',
          playerNumber: '10',
          gameTime: '15:42',
          refereeComment: comment,
          highImpact: true
        });

      expect(response.status).toBe(201);
      expect(response.body.refereeComment).toBe(comment);
    });

    test('should mark high-impact events', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'card',
          team: 'B',
          playerNumber: '5',
          gameTime: '23:15',
          cardType: 'yellow',
          highImpact: true
        });

      expect(response.status).toBe(201);
      expect(response.body.highImpact).toBe(true);
    });

    test('should validate event types', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'invalid_type',
          team: 'A',
          playerNumber: '10',
          gameTime: '15:42'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should accept all valid event types', async () => {
      const eventTypes = ['penalty', 'scrum', 'lineout', 'maul', 'try', 'card', 'substitution', 'conversion', 'drop_goal', 'ruck', 'tackle'];

      for (const eventType of eventTypes) {
        const response = await request(app)
          .post(`/api/matches/${matchId}/events`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            eventType,
            team: 'A',
            playerNumber: '10',
            gameTime: '15:42'
          });

        expect(response.status).toBe(201);
        expect(response.body.eventType).toBe(eventType);
      }
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/matches/${matchId}/events`)
        .send({
          eventType: 'penalty',
          team: 'A',
          playerNumber: '10',
          gameTime: '15:42'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/:id/events - Get Event Timeline', () => {
    test('should return events in chronological order', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Verify chronological order
      for (let i = 1; i < response.body.length; i++) {
        const prev = new Date(response.body[i - 1].timestamp_exact).getTime();
        const curr = new Date(response.body[i].timestamp_exact).getTime();
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    test('should filter events by team', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/events?team=A`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All events should be from team A
      response.body.forEach(event => {
        expect(event.team).toBe('A');
      });
    });

    test('should filter events by type', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/events?type=penalty`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All events should be penalties
      response.body.forEach(event => {
        expect(event.event_type).toBe('penalty');
      });
    });

    test('should include event details', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        const event = response.body[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('event_uuid');
        expect(event).toHaveProperty('event_type');
        expect(event).toHaveProperty('team');
        expect(event).toHaveProperty('game_time');
        expect(event).toHaveProperty('timestamp_exact');
        expect(event).toHaveProperty('referee_comment');
      }
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/matches/${matchId}/events`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/matches/:id/events/:eventId - Delete Event', () => {
    let eventIdToDelete;

    beforeAll(async () => {
      // Create an event to delete
      const response = await request(app)
        .post(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'penalty',
          team: 'A',
          playerNumber: '10',
          gameTime: '15:42',
          refereeComment: 'Event to delete'
        });

      eventIdToDelete = response.body.eventId;
    });

    test('should delete event by ID', async () => {
      const response = await request(app)
        .delete(`/api/matches/${matchId}/events/${eventIdToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should only allow referee/evaluator to delete', async () => {
      // Create event
      const eventResponse = await request(app)
        .post(`/api/matches/${matchId}/events`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'penalty',
          team: 'A',
          playerNumber: '10',
          gameTime: '15:42'
        });

      const eventId = eventResponse.body.eventId;

      // Login as analyst (should not be able to delete)
      const analystLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'analyst-a@club.com',
          password: 'password123'
        });

      const analystToken = analystLogin.body.token;

      const deleteResponse = await request(app)
        .delete(`/api/matches/${matchId}/events/${eventId}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(deleteResponse.status).toBe(403);
    });

    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .delete(`/api/matches/${matchId}/events/99999`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});

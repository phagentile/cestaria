/**
 * Authentication Endpoint Tests
 * Tests for /api/auth/login endpoint
 */

const request = require('supertest');
const app = require('../server');

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/login', () => {
    test('should return JWT token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'referee@club.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.token).toBeTruthy();
      expect(response.body.token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should include user role in JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'referee@club.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('role');
      expect(['referee', 'analyst', 'evaluator', 'admin']).toContain(response.body.user.role);
    });

    test('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@club.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should return user details in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'referee@club.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('fullName');
      expect(response.body.user.email).toBe('referee@club.com');
    });
  });

  describe('JWT Token Validation', () => {
    test('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/matches');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/matches')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should accept requests with valid JWT token', async () => {
      // First get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'referee@club.com',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      // Then use it to access a protected endpoint
      const response = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${token}`);

      // Should not return 401 or 403 (auth errors)
      expect([401, 403]).not.toContain(response.status);
    });
  });
});

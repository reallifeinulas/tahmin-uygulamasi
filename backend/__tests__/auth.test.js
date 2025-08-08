const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');
const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());

// Mock database
const mockDb = {
  execute: jest.fn(),
};

app.locals.db = mockDb;
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockDb.execute.mockReset();
  });

  describe('POST /api/auth/login', () => {
    it('should return a token for valid credentials', async () => {
      // Mock the database response for a valid user
      mockDb.execute.mockResolvedValue([
        [{
          id: 1,
          username: 'testuser',
          password: '$2b$10$8K1p/a0dCVTrqLEoqQbm1.dODj4/iMq3kGFjKrJSdYkxlVF3rJhqu' // "user123"
        }]
      ]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@tahmin.com',
          password: 'user123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for invalid credentials', async () => {
      // Mock the database response for a non-existent user
      mockDb.execute.mockResolvedValue([[]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@tahmin.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Geçersiz kimlik bilgileri');
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });
  });
});

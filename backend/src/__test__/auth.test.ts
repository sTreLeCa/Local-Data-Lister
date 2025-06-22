// backend/src/__test__/auth.test.ts
import request from 'supertest';
import app from '../server';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ვმოქირავებთ prisma-ს და jwt-ს. bcrypt-ს არ ვმოქირავებთ.
jest.mock('../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock('jsonwebtoken');

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
// jwt-საც ვტიპავთ როგორც მოქირებულს
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Endpoints (/api/auth)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user successfully and return a token', async () => {
      // Arrange
      const newUser = { email: 'test-reg@example.com', password: 'password123' };
      const createdUser = { id: 'user-1', email: newUser.email, password: 'hashedpassword', createdAt: new Date(), updatedAt: new Date() };
      
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockResolvedValue(createdUser);
      // ვიყენებთ mockedJwt-ს, რომელიც ახლა განსაზღვრულია
      mockedJwt.sign.mockReturnValue('fake-jwt-token' as any);

      // Act
      const response = await request(app).post('/api/auth/register').send(newUser);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      // bcrypt.hash-ის შემოწმება რთულია, რადგან რეალურს ვიყენებთ.
      // მთავარია, რომ create გამოიძახეს სწორი email-ით და დაჰეშირებული პაროლით.
      expect(mockedPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: newUser.email })
        })
      );
    });

    it('should return 409 if user already exists', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);
      const response = await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: 'password123' });
      expect(response.status).toBe(409);
    });
  });

  describe('POST /login', () => {
    it('should log in an existing user and return a token', async () => {
      const loginCredentials = { email: 'user@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash(loginCredentials.password, 10);
      const existingUser = { id: 'user-2', email: loginCredentials.email, password: hashedPassword, createdAt: new Date(), updatedAt: new Date() };

      mockedPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockedJwt.sign.mockReturnValue('fake-login-token' as any);
      
      const response = await request(app).post('/api/auth/login').send(loginCredentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'fake-login-token');
    });

    it('should return 401 if password is incorrect', async () => {
      const loginCredentials = { email: 'user@example.com', password: 'wrongpassword' };
      const correctPassword = 'password123';
      const hashedPassword = await bcrypt.hash(correctPassword, 10);
      const existingUser = { id: 'user-3', email: loginCredentials.email, password: hashedPassword, createdAt: new Date(), updatedAt: new Date() };
      
      mockedPrisma.user.findUnique.mockResolvedValue(existingUser);
      
      const response = await request(app).post('/api/auth/login').send(loginCredentials);
      
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Incorrect email or password.');
    });
  });
});
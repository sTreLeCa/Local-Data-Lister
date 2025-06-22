// backend/src/__test__/auth.test.ts
import request from 'supertest';
import app from '../server';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// --- მოქირების განახლებული სექცია ---
// მოვქირავოთ მხოლოდ prisma, რადგან არ გვინდა რეალურ ბაზასთან კავშირი
jest.mock('../lib/prisma');
// bcrypt-ს და jwt-ს აღარ ვმოქირავებთ
// jest.mock('bcryptjs');
// jest.mock('jsonwebtoken');
// --- მოქირების დასასრული ---

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;


describe('Auth Endpoints (/api/auth)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user successfully and return a token', async () => {
      // Arrange
      const newUser = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash(newUser.password, 10); // ვიყენებთ რეალურ hash ფუნქციას
      const createdUser = { 
        id: 'user-1', 
        email: newUser.email, 
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockResolvedValue(createdUser);

      // Act
      const response = await request(app).post('/api/auth/register').send(newUser);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token'); // ვამოწმებთ, რომ token არსებობს
      expect(typeof response.body.token).toBe('string'); // ვამოწმებთ, რომ token არის სტრიქონი

      // ვამოწმებთ, რომ prisma.user.create გამოიძახეს სწორი მონაცემებით.
      // რადგან hash რეალურია, ზუსტ მნიშვნელობას ვერ შევადარებთ, მაგრამ შეგვიძლია შევამოწმოთ სტრუქტურა.
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: newUser.email,
          password: expect.any(String) // ველით ნებისმიერ სტრიქონს, რადგან hash ყოველთვის სხვადასხვაა
        },
      });
    });

    it('should return 409 if user already exists', async () => {
      const existingUser = { id: 'user-1', email: 'test@example.com', password: 'password123' };
      mockedPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      const response = await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('A user with this email already exists.');
    });
    
    it('should return 400 if email or password is missing', async () => {
        const response = await request(app).post('/api/auth/register').send({ email: 'test@example.com' });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Email and password are required.');
    });
  });

  describe('POST /login', () => {
    it('should log in an existing user and return a token', async () => {
        const loginCredentials = { email: 'user@example.com', password: 'password123' };
        // პაროლი უნდა დავჰეშოთ ისე, როგორც ბაზაში ინახება
        const hashedPassword = await bcrypt.hash(loginCredentials.password, 10);
        const existingUser = { id: 'user-2', email: loginCredentials.email, password: hashedPassword };

        mockedPrisma.user.findUnique.mockResolvedValue(existingUser as any);
        
        // compare ფუნქცია ახლა რეალურია
        const response = await request(app).post('/api/auth/login').send(loginCredentials);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
        expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginCredentials.email } });
    });

    it('should return 401 if user does not exist', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(null);
        const response = await request(app).post('/api/auth/login').send({ email: 'nouser@example.com', password: 'password123' });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Incorrect email or password.');
    });

    it('should return 401 if password is incorrect', async () => {
        const correctPassword = 'password123';
        const wrongPassword = 'wrongpassword';
        const hashedPassword = await bcrypt.hash(correctPassword, 10);
        const existingUser = { id: 'user-3', email: 'user@example.com', password: hashedPassword };
        
        mockedPrisma.user.findUnique.mockResolvedValue(existingUser as any);

        const response = await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: wrongPassword });
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Incorrect email or password.');
    });
  });
});
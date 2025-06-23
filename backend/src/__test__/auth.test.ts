// backend/src/__test__/auth.test.ts
import request from 'supertest';
import app from '../server';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// --- Module Mocks ---
// We mock the Prisma client to prevent tests from interacting with the real database.
// The factory function returns an object with jest.fn() for each model method we use.
jest.mock('../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

// We mock the jsonwebtoken library to control the tokens generated during tests
// and to avoid dealing with the actual secret key.
jest.mock('jsonwebtoken');

// Note: We are NOT mocking 'bcryptjs'. We will use its actual hashing and comparison
// functions to ensure our login logic works correctly with real hashes.

// --- Typed Mocks ---
// We create typed versions of our mocks for better autocompletion and type safety in tests.
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Endpoints (/api/auth)', () => {

  // Before each test, we clear all mock history (e.g., call counts, arguments)
  // to ensure tests are isolated and don't influence each other.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user successfully and return a token', async () => {
      // --- Arrange ---
      // Define the user input and the expected database record.
      const newUser = { email: 'test-reg@example.com', password: 'password123' };
      const createdUser = { id: 'user-1', email: newUser.email, password: 'hashedpassword', createdAt: new Date(), updatedAt: new Date() };
      
      // Configure the mock functions for this specific test case.
      mockedPrisma.user.findUnique.mockResolvedValue(null); // Simulate that the user does not exist yet.
      mockedPrisma.user.create.mockResolvedValue(createdUser); // Simulate successful user creation.
      (mockedJwt.sign as jest.Mock).mockReturnValue('fake-jwt-token'); // Return a predictable token.

      // --- Act ---
      // Send a POST request to the registration endpoint.
      const response = await request(app).post('/api/auth/register').send(newUser);

      // --- Assert ---
      // Check for a successful creation status code and the presence of the token.
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      
      // Verify that the create function was called with the correct email and a hashed password.
      // We use expect.any(String) for the password because the actual hash from bcrypt
      // would be different each time.
      expect(mockedPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: newUser.email })
        })
      );
    });

    it('should return 409 Conflict if user already exists', async () => {
      // Arrange: Simulate that findUnique finds an existing user.
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);
      
      // Act
      const response = await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: 'password123' });
      
      // Assert: Expect a 409 Conflict status.
      expect(response.status).toBe(409);
    });
  });

  describe('POST /login', () => {
    it('should log in an existing user and return a token', async () => {
      // Arrange
      const loginCredentials = { email: 'user@example.com', password: 'password123' };
      // Use the real bcrypt.hash to simulate a real stored password.
      const hashedPassword = await bcrypt.hash(loginCredentials.password, 10);
      const existingUser = { id: 'user-2', email: loginCredentials.email, password: hashedPassword, createdAt: new Date(), updatedAt: new Date() };

      // Simulate finding the user in the database.
      mockedPrisma.user.findUnique.mockResolvedValue(existingUser);
      // Simulate a successful token generation.
      (mockedJwt.sign as jest.Mock).mockReturnValue('fake-login-token');
      
      // Act
      const response = await request(app).post('/api/auth/login').send(loginCredentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'fake-login-token');
    });

    it('should return 401 Unauthorized if password is incorrect', async () => {
      // Arrange
      const loginCredentials = { email: 'user@example.com', password: 'wrongpassword' };
      const correctPassword = 'password123';
      // Create a user with a hash of the *correct* password.
      const hashedPassword = await bcrypt.hash(correctPassword, 10);
      const existingUser = { id: 'user-3', email: loginCredentials.email, password: hashedPassword, createdAt: new Date(), updatedAt: new Date() };
      
      // Simulate finding the user.
      mockedPrisma.user.findUnique.mockResolvedValue(existingUser);
      
      // Act: Attempt to log in with the wrong password.
      const response = await request(app).post('/api/auth/login').send(loginCredentials);
      
      // Assert: Expect a 401 Unauthorized status.
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Incorrect email or password.');
    });
  });
});
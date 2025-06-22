// backend/src/__test__/websockets.test.ts
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import app from '../server';
import prisma from '../lib/prisma';
import { initSocket, getIO } from '../socketManager';
import type { LocalItem } from '@local-data/types';
import { describe, it, expect, jest, afterAll, beforeAll, beforeEach, afterEach } from '@jest/globals';

// --- მოქირავების სექცია ---
jest.mock('../lib/prisma', () => ({
  userFavorite: { create: jest.fn(), delete: jest.fn() },
  localItem: { upsert: jest.fn() },
}));

jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: () => void) => {
    req.user = { id: 'mock-user-id' };
    next();
  },
}));
// socketManager-ს აღარ ვმოქირავებთ, რადგან რეალურს ვტესტავთ
// jest.mock('../socketManager');
// --- მოქირავების დასასრული ---

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('WebSocket Event Emission on Favorites Change', () => {
  let httpServer: http.Server;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverAddress: string;

  beforeAll((done) => {
    httpServer = http.createServer(app);
    io = initSocket(httpServer);
    
    // ვამატებთ middleware-ს, რომელიც io-ს request-ს გადასცემს
    app.use((req, res, next) => {
      (req as any).io = io;
      next();
    });

    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      serverAddress = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    jest.clearAllMocks();
    clientSocket = Client(serverAddress);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it('should emit a "favoriteUpdate" event when a new item is favorited', (done) => {
    const newItem: Partial<LocalItem> = { id: 'ws-test-item', name: 'WS Test Item', type: 'Park', location: { latitude: 1, longitude: 1 }};
    const expectedEventData = {
        userId: 'mock-user-id',
        item: expect.objectContaining({ id: 'ws-test-item' }),
        action: 'added'
    };
    
    mockedPrisma.localItem.upsert.mockResolvedValue(newItem as any);
    mockedPrisma.userFavorite.create.mockResolvedValue({} as any);

    clientSocket.on('favoriteUpdate', (data) => {
      try {
        expect(data).toEqual(expectedEventData);
        done();
      } catch (error) {
        done(error as Error); // TypeScript-ს ვუთხრათ, რომ error არის Error ტიპის
      }
    });

    request(app).post('/api/me/favorites').send(newItem).expect(201).end(err => {
        if (err) return done(err);
    });
  });

  it('should emit a "favoriteUpdate" event when an item is unfavorited', (done) => {
    const itemIdToDelete = 'ws-delete-item';
    const expectedEventData = {
        userId: 'mock-user-id',
        itemId: itemIdToDelete,
        action: 'removed'
    };

    mockedPrisma.userFavorite.delete.mockResolvedValue({} as any);

    clientSocket.on('favoriteUpdate', (data) => {
        try {
            expect(data).toEqual(expectedEventData);
            done();
        } catch (error) {
            done(error as Error); // TypeScript-ს ვუთხრათ, რომ error არის Error ტიპის
        }
    });

    request(app).delete(`/api/me/favorites/${itemIdToDelete}`).expect(204).end(err => {
        if (err) return done(err);
    });
  });
});
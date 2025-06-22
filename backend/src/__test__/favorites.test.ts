// backend/src/__test__/favorites.test.ts
import request from 'supertest';
import app from '../server';
import prisma from '../lib/prisma';
import type { LocalItem } from '@local-data/types';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../lib/prisma');
// მოვქირავოთ ჩვენი auth middleware, რომ არ დაგვჭირდეს JWT-სთან მუშაობა ტესტებში
jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: () => void) => {
    // ტესტებში ყველა მოთხოვნას ავტომატურად დავამატებთ mock user-ს
    req.user = { id: 'mock-user-id', email: 'mock@user.com' };
    next();
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Favorites Endpoints (/api/me/favorites)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return a list of favorited items for the authenticated user', async () => {
      const mockFavorites = [
        { userId: 'mock-user-id', localItemId: 'item-1', localItem: { id: 'item-1', name: 'Favorite Item 1', locationJson: {} } },
        { userId: 'mock-user-id', localItemId: 'item-2', localItem: { id: 'item-2', name: 'Favorite Item 2', locationJson: {} } },
      ];
      mockedPrisma.userFavorite.findMany.mockResolvedValue(mockFavorites as any);

      const response = await request(app).get('/api/me/favorites');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Favorite Item 1');
      expect(mockedPrisma.userFavorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'mock-user-id' },
        include: { localItem: true },
        orderBy: { favoritedAt: 'desc' },
      });
    });
  });

  describe('POST /', () => {
    it('should add an item to favorites', async () => {
        const newItem: Partial<LocalItem> = { id: 'new-fav-item', name: 'New Favorite', type: 'Restaurant', location: { latitude: 1, longitude: 1 } };
        const createdFavorite = { userId: 'mock-user-id', localItemId: 'new-fav-item' };

        // მოვქირავოთ upsert და create
        mockedPrisma.localItem.upsert.mockResolvedValue(newItem as any);
        mockedPrisma.userFavorite.create.mockResolvedValue(createdFavorite as any);

        const response = await request(app).post('/api/me/favorites').send(newItem);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(createdFavorite);
        expect(mockedPrisma.localItem.upsert).toHaveBeenCalled();
        expect(mockedPrisma.userFavorite.create).toHaveBeenCalledWith({
            data: { userId: 'mock-user-id', localItemId: 'new-fav-item' }
        });
    });

    it('should return 409 if item is already favorited', async () => {
        const newItem: Partial<LocalItem> = { id: 'existing-fav', name: 'Existing Favorite' };
        // Prisma-ს P2002 შეცდომის სიმულაცია
        mockedPrisma.userFavorite.create.mockRejectedValue({ code: 'P2002' });

        const response = await request(app).post('/api/me/favorites').send(newItem);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('You have already favorited this item.');
    });
  });

  describe('DELETE /:itemId', () => {
    it('should remove an item from favorites', async () => {
        const itemIdToDelete = 'item-to-delete';
        mockedPrisma.userFavorite.delete.mockResolvedValue({} as any);

        const response = await request(app).delete(`/api/me/favorites/${itemIdToDelete}`);

        expect(response.status).toBe(204); // No Content
        expect(mockedPrisma.userFavorite.delete).toHaveBeenCalledWith({
            where: { userId_localItemId: { userId: 'mock-user-id', localItemId: itemIdToDelete } }
        });
    });

    it('should return 404 if favorite to delete is not found', async () => {
        const itemIdToDelete = 'not-found-item';
        // Prisma-ს P2025 შეცდომის სიმულაცია
        mockedPrisma.userFavorite.delete.mockRejectedValue({ code: 'P2025' });

        const response = await request(app).delete(`/api/me/favorites/${itemIdToDelete}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Favorite not found.');
    });
  });
});
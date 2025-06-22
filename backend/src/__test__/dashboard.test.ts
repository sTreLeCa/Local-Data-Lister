// backend/src/__test__/dashboard.test.ts
import request from 'supertest';
import app from '../server';
import prisma from '../lib/prisma';
import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../lib/prisma', () => ({
  userFavorite: {
    groupBy: jest.fn(),
  },
  localItem: {
    findMany: jest.fn(),
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Dashboard Endpoints (/api/dashboard)', () => {
  it('should return a list of items sorted by their favorite count', async () => {
    const mockPopularityCounts = [
      { localItemId: 'item-2', _count: { localItemId: 5 } },
      { localItemId: 'item-1', _count: { localItemId: 3 } },
    ];
    const mockItemDetails = [
      { id: 'item-1', name: 'Less Popular Item', locationJson: {} },
      { id: 'item-2', name: 'Most Popular Item', locationJson: {} },
    ];

    mockedPrisma.userFavorite.groupBy.mockResolvedValue(mockPopularityCounts as any);
    mockedPrisma.localItem.findMany.mockResolvedValue(mockItemDetails as any);

    const response = await request(app).get('/api/dashboard/popular-items');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toBe('Most Popular Item');
    expect(response.body[0].favoriteCount).toBe(5);
  });
});
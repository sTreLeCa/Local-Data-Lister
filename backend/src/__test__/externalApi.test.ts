// backend/src/__test__/externalApi.test.ts
import request from 'supertest';
import app from '../server';
import * as cacheService from '../services/cacheService';
import * as foursquareService from '../services/foursquareService';
import { transformFoursquareResponseToLocalItems } from '../services/dataTransformer';
import type { LocalItem } from '@local-data/types';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.mock('../services/foursquareService');

const mockedSearchFoursquare = foursquareService.searchFoursquare as jest.MockedFunction<
  typeof foursquareService.searchFoursquare
>;

const mockFoursquareApiResponse: foursquareService.FoursquareSearchResponse = {
  results: [
    {
      fsq_id: 'fs_restaurant1_cache_test',
      name: 'Mock Pizza for Cache Test',
      categories: [{ id: 13065, name: 'Pizza Place', icon: { prefix: 'uri', suffix: '.png' } }],
      geocodes: { main: { latitude: 40.123, longitude: -74.456 } },
      location: { address: '1 Test Rd', locality: 'CacheCity', region: 'TS', postcode: '54321', country: 'US', formatted_address: '1 Test Rd, CacheCity, TS 54321, US' },
      description: 'A pizza place for cache testing.',
      rating: 8.2,
      chains: [], distance: 0, link: '', related_places: {}, timezone: 'America/New_York', photos: [], price: 2, website: 'http://mock.pizza'
    },
    {
      fsq_id: 'fs_park1_cache_test',
      name: 'Mock Park for Cache Test',
      categories: [{ id: 16032, name: 'Park', icon: { prefix: 'uri', suffix: '.png' } }],
      geocodes: { main: { latitude: 40.456, longitude: -74.789 } },
      location: { address: '2 Test Ave', locality: 'CacheCity', region: 'TS', postcode: '54321', country: 'US', formatted_address: '2 Test Ave, CacheCity, TS 54321, US' },
      description: 'A park for cache testing.',
      rating: 8.5,
      chains: [], distance: 0, link: '', related_places: {}, timezone: 'America/New_York', photos: []
    },
  ],
};

// ტიპი იმ ობიექტისთვის, რომელსაც server.ts ინახავს ქეშში
// და რასაც ველოდებით cacheService.get-ისგან (თუმცა პირდაპირ get-ს აღარ ვამოწმებთ)
type ExpectedCachedData = {
  items: LocalItem[];
  totalResultsFromSource: number;
  sourceApi: 'foursquare';
  requestParams: {
    limit: number;
    offset: number;
  };
};

describe('GET /api/external/items - Caching Behavior', () => {
  const expectedTransformedItems: LocalItem[] = transformFoursquareResponseToLocalItems(mockFoursquareApiResponse);
  const baseQuery = { location: 'CacheCity', term: 'testcache' };
  let testCacheKey: string; // ეს მაინც დაგვჭირდება ლოგირებისთვის, თუ გვინდა

  beforeEach(() => {
    cacheService.flush();
    mockedSearchFoursquare.mockClear();
    testCacheKey = cacheService.generateApiCacheKey('external-items', baseQuery);
    console.log(`[TEST DEBUG] beforeEach: Generated testCacheKey for current test: ${testCacheKey}`);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should first miss cache, call Foursquare, store in cache, then hit cache on second identical request', async () => {
    mockedSearchFoursquare.mockResolvedValue(mockFoursquareApiResponse);

    // --- 1. პირველი მოთხოვნა (Cache Miss) ---
    const response1 = await request(app).get('/api/external/items').query(baseQuery);

    expect(response1.status).toBe(200);
    expect(response1.body.source).toBe('foursquare');
    expect(response1.body.items).toEqual(expectedTransformedItems);
    expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1);
    expect(mockedSearchFoursquare).toHaveBeenCalledWith(
      expect.objectContaining({ near: 'CacheCity', query: 'testcache', limit: 20 })
    );

    // --- 2. მეორე, იდენტური მოთხოვნა (Cache Hit) ---
    const response2 = await request(app).get('/api/external/items').query(baseQuery);

    expect(response2.status).toBe(200);
    expect(response2.body.source).toBe('cache');
    expect(response2.body.items).toEqual(expectedTransformedItems);
    expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1); // ჯამში ისევ 1 გამოძახება
  });

  describe('TTL Expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should miss cache again after TTL (set by server) expires', async () => {
      const serverSetTTL = 3600;

      mockedSearchFoursquare.mockResolvedValue(mockFoursquareApiResponse);
      // 1. პირველი მოთხოვნა, ქეშავს მონაცემებს
      const initialResponse = await request(app).get('/api/external/items').query(baseQuery);
      expect(initialResponse.body.source).toBe('foursquare');
      expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1);
      
      mockedSearchFoursquare.mockClear();

      // 2. დროის გადახვევა
      jest.advanceTimersByTime((serverSetTTL + 5) * 1000);

      // 3. მეორე მოთხოვნა, ისევ cache miss უნდა იყოს
      const freshMockDataName = "Fresh Data after TTL Test"; // უნიკალური სახელი
      const freshMockResponse: foursquareService.FoursquareSearchResponse = {
        ...mockFoursquareApiResponse,
        results: [{ ...mockFoursquareApiResponse.results[0], fsq_id: 'fs_restaurant1_fresh', name: freshMockDataName }], // შევცვალოთ სახელი და ID
      };
      const freshExpectedTransformedItems = transformFoursquareResponseToLocalItems(freshMockResponse);
      mockedSearchFoursquare.mockResolvedValue(freshMockResponse);

      const responseAfterTTLExpiry = await request(app).get('/api/external/items').query(baseQuery);
      
      expect(responseAfterTTLExpiry.status).toBe(200);
      expect(responseAfterTTLExpiry.body.source).toBe('foursquare');
      expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1);
      expect(responseAfterTTLExpiry.body.items).toEqual(freshExpectedTransformedItems);
      expect(responseAfterTTLExpiry.body.items[0]?.name).toBe(freshMockDataName);
    });
  });
});
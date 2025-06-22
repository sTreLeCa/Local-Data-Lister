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

const mockSingleRestaurantResult: foursquareService.FoursquarePlace = {
  fsq_id: 'fs_single_resto', name: 'Single Test Restaurant',
  categories: [{ id: 13065, name: 'Italian Restaurant', icon: { prefix: 'p', suffix: 's' } }],
  geocodes: { main: { latitude: 40.7, longitude: -74.0 } },
  location: { address: '1 Main St', locality: 'TestCity', region: 'TS', postcode: '12345', country: 'US', formatted_address: '1 Main St, TestCity, TS 12345, US' },
  description: 'A single restaurant for testing.', rating: 9.0,
  chains: [], distance: 0, link: '', related_places: {}, timezone: 'America/New_York', photos: [], price: 1
};
const mockApiResponseSingleRestaurant: foursquareService.FoursquareSearchResponse = { results: [mockSingleRestaurantResult] };
const mockApiResponseEmpty: foursquareService.FoursquareSearchResponse = { results: [] };


describe('GET /api/external/items - Comprehensive Tests', () => {
  // მოსალოდნელი ტრანსფორმირებული შედეგი, როდესაც Foursquare აბრუნებს ერთ რესტორანს
  const expectedTransformedSingleRestaurant: LocalItem[] = transformFoursquareResponseToLocalItems(mockApiResponseSingleRestaurant);

  beforeEach(() => {
    cacheService.flush();
    mockedSearchFoursquare.mockClear();
    // ყოველი ტესტის წინ, დავაყენოთ დეფოლტ წარმატებული პასუხი მოქისთვის, თუ კონკრეტული ტესტი სხვას არ მოითხოვს
    mockedSearchFoursquare.mockResolvedValue(mockApiResponseSingleRestaurant);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --- ქეშირების ტესტები (წინა პასუხიდან, ოდნავ შესწორებული) ---
  describe('Caching Behavior', () => {
    const baseQueryForCache = { location: 'CacheCity', term: 'cachingtest' };
    // მოსალოდნელი ტრანსფორმირებული შედეგი ამ კონკრეტული mockApiResponse-თვის
    const expectedCacheTestItems: LocalItem[] = transformFoursquareResponseToLocalItems({
        results: [ // შევქმნათ უნიკალური მონაცემები ქეშის ტესტისთვის
            { ...mockSingleRestaurantResult, fsq_id: 'cache-resto-1', name: 'Restaurant for Cache', location: {...mockSingleRestaurantResult.location, locality: 'CacheCity'} }
        ]
    });


    it('should first miss cache, call Foursquare, store in cache, then hit cache on second identical request', async () => {
      mockedSearchFoursquare.mockResolvedValue({ results: [ // გამოვიყენოთ უნიკალური მონაცემები ამ ტესტისთვის
        { ...mockSingleRestaurantResult, fsq_id: 'cache-resto-1', name: 'Restaurant for Cache', location: {...mockSingleRestaurantResult.location, locality: 'CacheCity'} }
      ]});

      const response1 = await request(app).get('/api/external/items').query(baseQueryForCache);
      expect(response1.status).toBe(200);
      expect(response1.body.source).toBe('foursquare');
      expect(response1.body.items).toEqual(expectedCacheTestItems);
      expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1);

      const response2 = await request(app).get('/api/external/items').query(baseQueryForCache);
      expect(response2.status).toBe(200);
      expect(response2.body.source).toBe('cache');
      expect(response2.body.items).toEqual(expectedCacheTestItems);
      expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1);
    });

    describe('TTL Expiration', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      it('should miss cache again after TTL (set by server) expires', async () => {
        const serverSetTTL = 3600;
        mockedSearchFoursquare.mockResolvedValue({ results: [ // საწყისი მონაცემები
            { ...mockSingleRestaurantResult, fsq_id: 'ttl-resto-1', name: 'Restaurant for TTL Initial', location: {...mockSingleRestaurantResult.location, locality: 'CacheCity'} }
        ]});

        await request(app).get('/api/external/items').query(baseQueryForCache);
        expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1);
        mockedSearchFoursquare.mockClear();

        jest.advanceTimersByTime((serverSetTTL + 5) * 1000);

        const freshMockName = "Fresh Data after TTL";
        const freshApiResponse = { results: [
            { ...mockSingleRestaurantResult, fsq_id: 'ttl-resto-fresh', name: freshMockName, location: {...mockSingleRestaurantResult.location, locality: 'CacheCity'} }
        ]};
        const freshExpectedItems = transformFoursquareResponseToLocalItems(freshApiResponse);
        mockedSearchFoursquare.mockResolvedValue(freshApiResponse);

        const responseAfterTTLExpiry = await request(app).get('/api/external/items').query(baseQueryForCache);
        expect(responseAfterTTLExpiry.status).toBe(200);
        expect(responseAfterTTLExpiry.body.source).toBe('foursquare');
        expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1);
        expect(responseAfterTTLExpiry.body.items).toEqual(freshExpectedItems);
        expect(responseAfterTTLExpiry.body.items[0]?.name).toBe(freshMockName);
      });
    });
  });

  // --- წარმატებული სცენარები (DB4) ---
  describe('Success Scenarios', () => {
    it('should return items with location parameter only', async () => {
      const response = await request(app).get('/api/external/items').query({ location: 'TestCity' });
      expect(response.status).toBe(200);
      expect(response.body.source).toBe('foursquare');
      expect(response.body.items).toEqual(expectedTransformedSingleRestaurant);
      expect(mockedSearchFoursquare).toHaveBeenCalledWith(expect.objectContaining({ near: 'TestCity', limit: 20 }));
    });

    it('should return items with latitude and longitude parameters only', async () => {
      const response = await request(app).get('/api/external/items').query({ latitude: 40.7, longitude: -74.0 });
      expect(response.status).toBe(200);
      expect(response.body.items).toEqual(expectedTransformedSingleRestaurant);
      expect(mockedSearchFoursquare).toHaveBeenCalledWith(expect.objectContaining({ near: '40.7,-74', limit: 20 }));
    });

    it('should return items with location and term', async () => {
      const response = await request(app).get('/api/external/items').query({ location: 'TestCity', term: 'pizza' });
      expect(response.status).toBe(200);
      expect(response.body.items).toEqual(expectedTransformedSingleRestaurant);
      expect(mockedSearchFoursquare).toHaveBeenCalledWith(expect.objectContaining({ near: 'TestCity', query: 'pizza', limit: 20 }));
    });

    it('should respect the limit parameter', async () => {
      const response = await request(app).get('/api/external/items').query({ location: 'TestCity', limit: 1 });
      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(expectedTransformedSingleRestaurant.length); // მოსალოდნელია 1
      expect(mockedSearchFoursquare).toHaveBeenCalledWith(expect.objectContaining({ near: 'TestCity', limit: 1 }));
      expect(response.body.requestParams.limit).toBe(1);
    });

    it('should correctly transform data (check key fields)', async () => {
      const response = await request(app).get('/api/external/items').query({ location: 'TestCity' });
      expect(response.status).toBe(200);
      const item = response.body.items[0];
      expect(item.id).toBe(mockSingleRestaurantResult.fsq_id);
      expect(item.name).toBe(mockSingleRestaurantResult.name);
      if (item.type === 'Restaurant') { // დავამატე Type Guard
        expect(item.cuisineType).toBe(mockSingleRestaurantResult.categories[0].name);
      }
    });
  });

  // --- შეცდომების და კიდური შემთხვევების სცენარები (DB4) ---
  describe('Error and Edge Case Scenarios (Mocked Foursquare Behavior)', () => {
    it('should return empty items array if Foursquare returns empty results', async () => {
      mockedSearchFoursquare.mockResolvedValue(mockApiResponseEmpty);
      const response = await request(app).get('/api/external/items').query({ location: 'NoWhere' });
      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
      expect(response.body.totalResultsFromSource).toBe(0);
    });

it('should return 502 if Foursquare search throws a generic non-API error', async () => {
  mockedSearchFoursquare.mockRejectedValue(new Error('Foursquare is down'));
  const response = await request(app).get('/api/external/items').query({ location: 'TestCity' });
  expect(response.status).toBe(502);
  expect(response.body.code).toBe('EXTERNAL_SERVICE_ERROR');
  expect(response.body.message).toContain('Foursquare is down'); 
});
    
    it('should return specific Foursquare error (e.g. 401) if Foursquare API returns it', async () => {
        const foursquareApiError = new Error('Foursquare API request failed with status 401: {"message":"Authentication failed"}');
        mockedSearchFoursquare.mockRejectedValue(foursquareApiError);
        
        const response = await request(app).get('/api/external/items').query({ location: 'TestCity' });
        
        expect(response.status).toBe(401);
        expect(response.body.code).toBe('EXTERNAL_API_ERROR');
        expect(response.body.message).toContain('Authentication failed');
        expect(response.body.source).toBe('foursquare');
      });
  });

  // --- Input ვალიდაციის ტესტები (DB4) ---
  describe('Input Validation', () => {
    it('should return 400 if no location or lat/lon is provided', async () => {
      const response = await request(app).get('/api/external/items').query({ term: 'test' });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_LOCATION_PARAMS');
    });

    it('should return 400 if latitude is provided but longitude is missing', async () => {
      const response = await request(app).get('/api/external/items').query({ latitude: '40.7' });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_LOCATION_PARAMS');
    });
    
    it('should return 400 if longitude is provided but latitude is missing', async () => {
        const response = await request(app).get('/api/external/items').query({ longitude: '-74.0' });
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('MISSING_LOCATION_PARAMS');
      });

    it('should return 400 if latitude is invalid', async () => {
      const response = await request(app).get('/api/external/items').query({ latitude: 'invalid', longitude: '-74.0' });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_COORDINATES');
    });

    it('should return 400 if longitude is invalid', async () => {
      const response = await request(app).get('/api/external/items').query({ latitude: '40.7', longitude: 'invalid' });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_COORDINATES');
    });
    
    it('should return 400 if latitude is out of range', async () => {
        const response = await request(app).get('/api/external/items').query({ latitude: '91', longitude: '-74.0' });
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_LATITUDE_RANGE'); // server.ts-ში ასეა
    });

    it('should return 400 if limit is non-numeric', async () => {
      const response = await request(app).get('/api/external/items').query({ location: 'TestCity', limit: 'abc' });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_LIMIT');
    });

    it('should return 400 if limit is too large (e.g., > 50)', async () => {
      const response = await request(app).get('/api/external/items').query({ location: 'TestCity', limit: '51' });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('LIMIT_OUT_OF_BOUNDS');
    });

    it('should return 400 if limit is negative', async () => {
      const response = await request(app).get('/api/external/items').query({ location: 'TestCity', limit: '-5' });
      expect(response.status).toBe(400);
      // server.ts-ში, isValidInteger დააბრუნებს true-ს -5-ზე.
      // შემდეგ parsedLimit იქნება -5.
      // if (parsedLimit < 1 || parsedLimit > 50) ეს პირობა შესრულდება.
      // ამიტომ, code უნდა იყოს LIMIT_OUT_OF_BOUNDS
      expect(response.body.code).toBe('LIMIT_OUT_OF_BOUNDS');
    });
    
    it('should return 400 if offset is non-numeric', async () => {
        const response = await request(app).get('/api/external/items').query({ location: 'TestCity', offset: 'abc' });
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_OFFSET');
    });

    it('should return 400 if offset is negative', async () => {
        const response = await request(app).get('/api/external/items').query({ location: 'TestCity', offset: '-1' });
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('NEGATIVE_OFFSET');
    });

    it('should return 400 if location is an empty string after trim', async () => {
        const response = await request(app).get('/api/external/items').query({ location: '  ' });
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('EMPTY_LOCATION');
    });

    it('should return 400 if term is an empty string after trim', async () => {
        const response = await request(app).get('/api/external/items').query({ location: 'TestCity', term: '  ' });
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('EMPTY_TERM');
    });
  });
});
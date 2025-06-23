// backend/src/__test__/externalApi.test.ts
import request from 'supertest';
import app from '../server';
import * as cacheService from '../services/cacheService';
import * as foursquareService from '../services/foursquareService';
import { transformFoursquareResponseToLocalItems } from '../services/dataTransformer';
import type { LocalItem } from '@local-data/types';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// We mock the entire foursquareService module. This means any call to its functions
// (like searchFoursquare) inside our app during the test will be intercepted by Jest.
jest.mock('../services/foursquareService');

// We create a typed mock of the specific function we want to control.
// This gives us type safety and autocompletion for mock implementations.
const mockedSearchFoursquare = foursquareService.searchFoursquare as jest.MockedFunction<
  typeof foursquareService.searchFoursquare
>;

// --- Mock Data Setup ---
// Define reusable mock data for Foursquare API responses.
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
  // We pre-calculate the expected transformed result to use in assertions.
  // This ensures our tests are checking against what the dataTransformer *should* produce.
  const expectedTransformedSingleRestaurant: LocalItem[] = transformFoursquareResponseToLocalItems(mockApiResponseSingleRestaurant);

  // This runs before each test in this suite.
  beforeEach(() => {
    cacheService.flush(); // Clear the cache to ensure no data from previous tests interferes.
    mockedSearchFoursquare.mockClear(); // Clear call history of the mocked function.
    // Set a default successful mock implementation for searchFoursquare.
    // Individual tests can override this if they need to test error cases.
    mockedSearchFoursquare.mockResolvedValue(mockApiResponseSingleRestaurant);
  });

  // This runs after each test, ensuring Jest's fake timers are reset to real ones.
  afterEach(() => {
    jest.useRealTimers();
  });

  // --- Caching Behavior Tests ---
  describe('Caching Behavior', () => {
    const baseQueryForCache = { location: 'CacheCity', term: 'cachingtest' };
    const mockCacheApiResponse = { results: [
      { ...mockSingleRestaurantResult, fsq_id: 'cache-resto-1', name: 'Restaurant for Cache', location: {...mockSingleRestaurantResult.location, locality: 'CacheCity'} }
    ]};
    const expectedCacheTestItems: LocalItem[] = transformFoursquareResponseToLocalItems(mockCacheApiResponse);

    it('should first miss cache, call Foursquare, store in cache, then hit cache on second identical request', async () => {
      mockedSearchFoursquare.mockResolvedValue(mockCacheApiResponse);

      // 1. First request: Should be a cache MISS.
      const response1 = await request(app).get('/api/external/items').query(baseQueryForCache);
      expect(response1.status).toBe(200);
      expect(response1.body.source).toBe('foursquare'); // Source should be the live API.
      expect(response1.body.items).toEqual(expectedCacheTestItems);
      expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1); // The real service should be called once.

      // 2. Second, identical request: Should be a cache HIT.
      const response2 = await request(app).get('/api/external/items').query(baseQueryForCache);
      expect(response2.status).toBe(200);
      expect(response2.body.source).toBe('cache'); // Source is now the cache.
      expect(response2.body.items).toEqual(expectedCacheTestItems);
      expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1); // The service should NOT be called again.
    });

    describe('TTL Expiration', () => {
      beforeEach(() => {
        jest.useFakeTimers(); // Enable Jest's fake timers for this block.
      });

      it('should miss cache again after TTL (set by server) expires', async () => {
        const serverSetTTL = 3600; // The TTL set in server.ts (in seconds).
        mockedSearchFoursquare.mockResolvedValue(mockCacheApiResponse);

        // 1. First request to populate the cache.
        await request(app).get('/api/external/items').query(baseQueryForCache);
        expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1);
        mockedSearchFoursquare.mockClear();

        // 2. Advance time past the TTL.
        jest.advanceTimersByTime((serverSetTTL + 5) * 1000);

        // 3. Second request: Should be a cache MISS again because TTL expired.
        const freshMockResponse = { results: [{ ...mockSingleRestaurantResult, name: "Fresh Data after TTL" }]};
        const freshExpectedItems = transformFoursquareResponseToLocalItems(freshMockResponse);
        mockedSearchFoursquare.mockResolvedValue(freshMockResponse);

        const responseAfterTTLExpiry = await request(app).get('/api/external/items').query(baseQueryForCache);
        
        expect(responseAfterTTLExpiry.status).toBe(200);
        expect(responseAfterTTLExpiry.body.source).toBe('foursquare'); // It's a miss, so source is live API.
        expect(mockedSearchFoursquare).toHaveBeenCalledTimes(1); // Service was called again.
        expect(responseAfterTTLExpiry.body.items[0]?.name).toBe("Fresh Data after TTL");
      });
    });
  });

  // --- Success Scenarios Tests ---
  describe('Success Scenarios', () => {
    it('should return items with location parameter only', async () => { /* ... */ });
    it('should return items with latitude and longitude parameters only', async () => { /* ... */ });
    it('should return items with location and term', async () => { /* ... */ });
    it('should respect the limit parameter', async () => { /* ... */ });
    it('should correctly transform data (check key fields)', async () => { /* ... */ });
  });

  // --- Error and Edge Case Scenarios Tests ---
  describe('Error and Edge Case Scenarios (Mocked Foursquare Behavior)', () => {
    it('should return empty items array if Foursquare returns empty results', async () => { /* ... */ });
    it('should return 502 if Foursquare search throws a generic non-API error', async () => { /* ... */ });
    it('should return specific Foursquare error (e.g. 401) if Foursquare API returns it', async () => { /* ... */ });
  });

  // --- Input Validation Tests ---
  describe('Input Validation', () => {
    it('should return 400 if no location or lat/lon is provided', async () => { /* ... */ });
    it('should return 400 if latitude is provided but longitude is missing', async () => { /* ... */ });
    // ... more validation tests
  });
});
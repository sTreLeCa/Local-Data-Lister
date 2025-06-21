// backend/src/services/__test__/cacheService.test.ts
import * as cacheService from '../cacheService'; // იმპორტი შენი cacheService-დან
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Cache Service', () => {
  // ყოველი ტესტის წინ გავასუფთავოთ ქეში, რომ ტესტები იზოლირებული იყოს
  beforeEach(() => {
    cacheService.flush();
  });

  describe('get and set', () => {
    it('should set a value and then get it', () => {
      const key = 'testKey';
      const value = { data: 'testData' };
      cacheService.set(key, value);
      const retrievedValue = cacheService.get(key);
      expect(retrievedValue).toEqual(value);
    });

    it('should return undefined for a non-existent key', () => {
      const retrievedValue = cacheService.get('nonExistentKey');
      expect(retrievedValue).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true if a key exists', () => {
      cacheService.set('existingKey', 'someValue');
      expect(cacheService.has('existingKey')).toBe(true);
    });

    it('should return false if a key does not exist', () => {
      expect(cacheService.has('anotherNonExistentKey')).toBe(false);
    });
  });

  describe('del', () => {
    it('should delete a key and has should return false afterwards', () => {
      const key = 'keyToDelete';
      cacheService.set(key, 'value');
      expect(cacheService.has(key)).toBe(true);
      const deleteCount = cacheService.del(key);
      expect(deleteCount).toBe(1);
      expect(cacheService.has(key)).toBe(false);
      expect(cacheService.get(key)).toBeUndefined();
    });

    it('should delete multiple keys if an array is passed', () => {
      cacheService.set('key1', 'val1');
      cacheService.set('key2', 'val2');
      const deleteCount = cacheService.del(['key1', 'key2']);
      expect(deleteCount).toBe(2);
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });

    it('should return 0 if deleting a non-existent key', () => {
      const deleteCount = cacheService.del('nonExistentKeyForDel');
      expect(deleteCount).toBe(0);
    });
  });

  describe('flush', () => {
    it('should clear all keys from the cache', () => {
      cacheService.set('keyA', 'valA');
      cacheService.set('keyB', 'valB');
      cacheService.flush();
      expect(cacheService.has('keyA')).toBe(false);
      expect(cacheService.has('keyB')).toBe(false);
    });
  });

  describe('TTL expiration', () => {
    // Jest-ის fake timer-ების გამოყენება TTL-ის შესამოწმებლად
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers(); // დავაბრუნოთ რეალური timer-ები
    });

    it('should expire a key after its TTL', () => {
      const key = 'ttlKey';
      const value = 'ttlValue';
      const ttlSeconds = 1; // 1 წამი TTL

      cacheService.set(key, value, ttlSeconds);
      expect(cacheService.get(key)).toEqual(value); // ჯერ არსებობს

      // გადავწიოთ დრო TTL-ზე მეტით
      jest.advanceTimersByTime(1001); // 1001 მილიწამი

      expect(cacheService.get(key)).toBeUndefined(); // ახლა ვადაგასული უნდა იყოს
      expect(cacheService.has(key)).toBe(false);
    });

    it('should use stdTTL if no TTL is provided on set', () => {
      // stdTTL არის 3600 წამი ჩვენს cacheService-ში
      const key = 'stdTtlKey';
      const value = 'stdTtlValue';
      
      cacheService.set(key, value); // TTL არ გადავეცით
      expect(cacheService.get(key)).toEqual(value);

      // გადავწიოთ დრო stdTTL-ზე ცოტა ნაკლებით
      jest.advanceTimersByTime(3599 * 1000);
      expect(cacheService.get(key)).toEqual(value); // ისევ უნდა არსებობდეს

      // გადავწიოთ დრო stdTTL-ზე მეტით (კიდევ 2 წამით)
      jest.advanceTimersByTime(2000);
      expect(cacheService.get(key)).toBeUndefined(); // ვადაგასული უნდა იყოს
    });
  });

  describe('generateApiCacheKey', () => {
    it('should generate a deterministic key regardless of parameter order', () => {
      const params1 = { location: 'New York', query: 'pizza' };
      const params2 = { query: 'pizza', location: 'New York' };
      const key1 = cacheService.generateApiCacheKey('test-endpoint', params1);
      const key2 = cacheService.generateApiCacheKey('test-endpoint', params2);
      expect(key1).toBe(key2);
      expect(key1).toBe('test-endpoint:location=new york:query=pizza');
    });

    it('should filter out undefined and empty string parameter values', () => {
      const params = { location: 'Paris', query: undefined, type: '', limit: 10 };
      const key = cacheService.generateApiCacheKey('test-endpoint', params);
      // undefined და '' (ცარიელი სტრიქონი) პარამეტრები არ უნდა მოხვდეს გასაღებში
      expect(key).toBe('test-endpoint:limit=10:location=paris');
    });

    it('should normalize parameter keys and values (lowercase, trim)', () => {
      const params = { ' Location ': '  London  ', QueryStr: '  BURGERS  ' };
      const key = cacheService.generateApiCacheKey('test-endpoint', params);
      expect(key).toBe('test-endpoint:location=london:querystr=burgers');
    });

    it('should handle numeric values correctly', () => {
      const params = { lat: 40.7128, lon: -74.0060 };
      const key = cacheService.generateApiCacheKey('geo-search', params);
      expect(key).toBe('geo-search:lat=40.7128:lon=-74.006');
    });

    it('should return only baseIdentifier if params are empty or all filterable', () => {
        const key1 = cacheService.generateApiCacheKey('empty-params', {});
        expect(key1).toBe('empty-params:'); // ან 'empty-params' თუ ბოლო ':' არ გვინდა
        
        const key2 = cacheService.generateApiCacheKey('filterable-params', { a: undefined, b: '' });
        expect(key2).toBe('filterable-params:');
    });
  });
});
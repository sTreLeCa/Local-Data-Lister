// backend/src/services/cacheService.ts
import NodeCache from 'node-cache';

// stdTTL: სტანდარტული სიცოცხლის ხანგრძლივობა წამებში (default Time To Live). 3600 წამი = 1 საათი.
// checkperiod: რამდენად ხშირად უნდა შემოწმდეს და წაიშალოს ვადაგასული ქეშის ჩანაწერები (წამებში). 120 წამი = 2 წუთი.
const appCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

console.log('Cache service initialized with default TTL of 1 hour.');

/**
 * Retrieves a value from the cache.
 * @param key The cache key.
 * @returns The cached value of type T, or undefined if not found or expired.
 */
export const get = <T>(key: string): T | undefined => {
  const value = appCache.get<T>(key);
  if (value) {
    console.log(`[CACHE] HIT for key: ${key}`);
  } else {
    console.log(`[CACHE] MISS for key: ${key}`);
  }
  return value;
};

/**
 * Stores a value in the cache.
 * @param key The cache key.
 * @param value The value to store.
 * @param ttlSeconds Optional. Time to live in seconds. If not provided, default TTL is used.
 * @returns True if the value was set successfully.
 */
export const set = <T>(key: string, value: T, ttlSeconds?: number): boolean => {
  let success: boolean;
  if (ttlSeconds) {
    success = appCache.set(key, value, ttlSeconds);
  } else {
    success = appCache.set(key, value); // Uses stdTTL
  }
  if (success) {
    console.log(`[CACHE] SET for key: ${key} (TTL: ${ttlSeconds || appCache.options.stdTTL}s)`);
  } else {
    console.error(`[CACHE] FAILED TO SET for key: ${key}`);
  }
  return success;
};

/**
 * Deletes one or more keys from the cache.
 * @param key A single key or an array of keys to delete.
 * @returns The number of keys deleted.
 */
export const del = (key: string | string[]): number => {
  const deletedCount = appCache.del(key);
  console.log(`[CACHE] DEL for key(s): ${Array.isArray(key) ? key.join(', ') : key}. Count: ${deletedCount}`);
  return deletedCount;
};

/**
 * Checks if a key exists in the cache.
 * @param key The cache key.
 * @returns True if the key exists and is not expired.
 */
export const has = (key: string): boolean => {
  const keyExists = appCache.has(key);
  console.log(`[CACHE] HAS for key: ${key} -> ${keyExists}`);
  return keyExists;
};

/**
 * Clears the entire cache.
 */
export const flush = (): void => {
  appCache.flushAll();
  console.log('[CACHE] FLUSHED all cache.');
};

/**
 * Generates a deterministic cache key for API requests.
 * Ensures that the order of parameters or case does not affect the key.
 * @param baseIdentifier A string to identify the API endpoint (e.g., 'external-items').
 * @param params An object of query parameters.
 * @returns A string representing the cache key.
 */
export const generateApiCacheKey = (
  baseIdentifier: string,
  params: Record<string, string | number | undefined>
): string => {
  const significantParams: Record<string, string> = {};

  // Filter, normalize, and collect significant parameters
  Object.keys(params).forEach(paramKey => { // შევცვალე key -> paramKey, რომ არ დაემთხვეს გარე ცვლადს
    const value = params[paramKey];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      // Normalize: convert to string, trim, and lowercase
      significantParams[paramKey.toLowerCase().trim()] = String(value).toLowerCase().trim();
    }
  });

  // Sort keys alphabetically to ensure deterministic order
  const sortedKeys = Object.keys(significantParams).sort();

  // Build the key string
  const paramString = sortedKeys
    .map(sortedKey => `${sortedKey}=${significantParams[sortedKey]}`) // შევცვალე key -> sortedKey
    .join(':'); // Use ':' or another delimiter

  const cacheKeyResult = `${baseIdentifier}:${paramString}`; // შევცვალე cacheKey -> cacheKeyResult, რომ არ დაემთხვეს გარე ცვლადს
  console.log(`[CACHE] Generated cache key: ${cacheKeyResult} for params:`, params);
  return cacheKeyResult;
};

/**
 * Returns an array of all keys currently in the cache.
 * @returns An array of strings representing the cache keys.
 */
export const keys = (): string[] => {
  const currentKeys = appCache.keys();
  console.log(`[CACHE] KEYS: ${currentKeys.length > 0 ? currentKeys.join(', ') : '(empty)'}`);
  return currentKeys;
};
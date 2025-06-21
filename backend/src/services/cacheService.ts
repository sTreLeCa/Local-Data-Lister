// backend/src/services/cacheService.ts
import NodeCache from 'node-cache';

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

// backend/src/services/cacheService.ts
// ... (NodeCache ინსტალაცია და წინა ფუნქციები) ...

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
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      // Normalize: convert to string, trim, and lowercase
      significantParams[key.toLowerCase().trim()] = String(value).toLowerCase().trim();
    }
  });

  // Sort keys alphabetically to ensure deterministic order
  const sortedKeys = Object.keys(significantParams).sort();

  // Build the key string
  const paramString = sortedKeys
    .map(key => `${key}=${significantParams[key]}`)
    .join(':'); // Use ':' or another delimiter

  const cacheKey = `${baseIdentifier}:${paramString}`;
  console.log(`[CACHE] Generated cache key: ${cacheKey} for params:`, params);
  return cacheKey;
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

// არ არის საჭირო default export, რადგან ფუნქციებს ცალ-ცალკე ვაექსპორტებთ.
// export default appCache; 
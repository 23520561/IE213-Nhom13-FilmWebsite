// In-memory cache store
const cache = new Map();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*} - Cached value or undefined
 */
export const getCache = (key) => {
  return cache.get(key);
};

/**
 * Set value in cache with optional TTL
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds (optional)
 */
export const setCache = (key, value, ttl) => {
  cache.set(key, value);
  
  if (ttl) {
    setTimeout(() => {
      cache.delete(key);
    }, ttl);
  }
};

/**
 * Clear specific cache key
 * @param {string} key - Cache key to clear
 */
export const clearCache = (key) => {
  cache.delete(key);
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.clear();
};

/**
 * Get cache size
 * @returns {number} - Number of cached items
 */
export const getCacheSize = () => {
  return cache.size;
};

/**
 * Cache wrapper for async functions
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to execute
 * @param {number} ttl - Time to live in milliseconds (optional)
 * @returns {*} - Cached or fresh value
 */
export const withCache = async (key, fn, ttl = 5 * 60 * 1000) => {
  const cached = getCache(key);
  if (cached) {
    return cached;
  }
  
  const result = await fn();
  setCache(key, result, ttl);
  return result;
};

export default {
  getCache,
  setCache,
  clearCache,
  clearAllCache,
  getCacheSize,
  withCache,
};

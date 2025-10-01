/**
 * Simple in-memory cache for API responses
 * Helps reduce API calls and improve performance
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private cache: Map<string, CacheItem<unknown>>;
  private defaultTTL: number; // Time to live in milliseconds

  constructor(defaultTTL = 5 * 60 * 1000) { // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set a cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Get a cache entry
   * Returns null if expired or not found
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

/**
 * Fetch with cache wrapper
 * Automatically caches GET requests
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  cacheTTL?: number
): Promise<T> {
  const method = options?.method || 'GET';
  const cacheKey = `${method}:${url}`;

  // Only cache GET requests
  if (method === 'GET') {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      console.log(`✅ Cache hit for: ${url}`);
      return cached;
    }
  }

  console.log(`🔄 Fetching from API: ${url}`);
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json() as T;

  // Cache GET requests
  if (method === 'GET') {
    apiCache.set(cacheKey, data, cacheTTL);
    console.log(`💾 Cached response for: ${url}`);
  }

  return data;
}

/**
 * Clear cache for a specific URL pattern
 */
export function clearCacheByPattern(pattern: string): void {
  const keys = Array.from(apiCache.getStats().keys);
  const matchedKeys = keys.filter(key => key.includes(pattern));

  matchedKeys.forEach(key => {
    apiCache.delete(key);
    console.log(`🗑️  Cleared cache for: ${key}`);
  });
}

export default apiCache;

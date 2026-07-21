// ============ B-BROWSER NETWORK MANAGER ============
// Handles internet connectivity, CORS, and fetch optimization

const NetworkManager = (function() {
  const CONFIG = {
    timeout: 30000,           // 30 second timeout
    retryAttempts: 3,         // Retry failed requests 3 times
    retryDelay: 1000,         // 1 second between retries
    enableCompression: true,
    enableCache: true,
    cacheExpiry: 3600000      // 1 hour cache expiry
  };

  const requestCache = new Map();

  function getCacheKey(url, options = {}) {
    return `${url}::${JSON.stringify(options)}`;
  }

  function isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    return (Date.now() - cacheEntry.timestamp) < CONFIG.cacheExpiry;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function fetchWithRetry(url, options = {}, attempt = 1) {
    try {
      // Check cache first
      if (options.method === 'GET' && CONFIG.enableCache) {
        const cacheKey = getCacheKey(url, options);
        const cached = requestCache.get(cacheKey);
        if (cached && isCacheValid(cached)) {
          return cached.response;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

      const fetchOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'B-Browser/1.0 (Electron)',
          'Accept-Encoding': CONFIG.enableCompression ? 'gzip, deflate' : 'identity',
          ...options.headers
        }
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok && attempt < CONFIG.retryAttempts) {
        await sleep(CONFIG.retryDelay * attempt);
        return fetchWithRetry(url, options, attempt + 1);
      }

      // Cache successful GET responses
      if (response.ok && options.method === 'GET' && CONFIG.enableCache) {
        const cacheKey = getCacheKey(url, options);
        const responseClone = response.clone();
        requestCache.set(cacheKey, {
          response: responseClone,
          timestamp: Date.now()
        });
      }

      return response;
    } catch (error) {
      if (attempt < CONFIG.retryAttempts) {
        await sleep(CONFIG.retryDelay * attempt);
        return fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  async function get(url, options = {}) {
    return fetchWithRetry(url, { ...options, method: 'GET' });
  }

  async function post(url, data, options = {}) {
    return fetchWithRetry(url, {
      ...options,
      method: 'POST',
      body: typeof data === 'string' ? data : JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  function clearCache() {
    requestCache.clear();
  }

  function getCacheStats() {
    return {
      entries: requestCache.size,
      size: Array.from(requestCache.values()).reduce((sum, entry) => {
        return sum + (entry.response ? entry.response.size || 0 : 0);
      }, 0)
    };
  }

  // Global fetch override for automatic retry and caching
  function enableGlobalFetch() {
    if (typeof window === 'undefined') return;
    
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // Use our enhanced fetch with retry and caching
      return fetchWithRetry(url, options);
    };
  }

  return {
    fetchWithRetry,
    get,
    post,
    clearCache,
    getCacheStats,
    enableGlobalFetch,
    setConfig: (key, value) => { CONFIG[key] = value; }
  };
})();

// Enable global fetch enhancements
if (typeof window !== 'undefined') {
  NetworkManager.enableGlobalFetch();
}

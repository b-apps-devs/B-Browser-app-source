// ============ B-BROWSER COOKIE MANAGER ============
// Handles persistent cookie storage and session management

const CookieManager = (function() {
  const COOKIE_STORE_KEY = "bbrowser-cookies";
  const SESSION_STORE_KEY = "bbrowser-session-data";

  function parseCookieString(cookieStr) {
    const cookies = [];
    if (!cookieStr) return cookies;
    
    cookieStr.split(';').forEach(cookie => {
      const trimmed = cookie.trim();
      if (!trimmed) return;
      
      const [name, value] = trimmed.split('=');
      if (name) {
        cookies.push({
          name: decodeURIComponent(name),
          value: decodeURIComponent(value || ''),
        });
      }
    });
    return cookies;
  }

  function getCookiesFromStorage(domain) {
    try {
      const stored = localStorage.getItem(COOKIE_STORE_KEY);
      if (!stored) return [];
      
      const allCookies = JSON.parse(stored);
      if (domain) {
        return allCookies.filter(c => c.domain === domain);
      }
      return allCookies;
    } catch (e) {
      console.error("Error retrieving cookies:", e);
      return [];
    }
  }

  function saveCookiesToStorage(cookies) {
    try {
      localStorage.setItem(COOKIE_STORE_KEY, JSON.stringify(cookies));
      return true;
    } catch (e) {
      console.error("Error saving cookies:", e);
      return false;
    }
  }

  function addCookie(name, value, options = {}) {
    try {
      const cookies = getCookiesFromStorage();
      const now = new Date();
      const maxAge = options.maxAge || (7 * 24 * 60 * 60); // 7 days default
      
      // Remove old cookie if exists
      const filtered = cookies.filter(c => 
        !(c.name === name && c.domain === (options.domain || 'local'))
      );
      
      // Add new cookie
      filtered.push({
        name,
        value,
        domain: options.domain || 'local',
        path: options.path || '/',
        expires: new Date(now.getTime() + maxAge * 1000).toISOString(),
        maxAge,
        secure: options.secure || false,
        httpOnly: options.httpOnly || false,
        sameSite: options.sameSite || 'Lax'
      });
      
      return saveCookiesToStorage(filtered);
    } catch (e) {
      console.error("Error adding cookie:", e);
      return false;
    }
  }

  function getCookie(name, domain = 'local') {
    const cookies = getCookiesFromStorage(domain);
    const cookie = cookies.find(c => c.name === name);
    if (cookie && cookie.expires) {
      const expireDate = new Date(cookie.expires);
      if (expireDate < new Date()) {
        removeCookie(name, domain);
        return null;
      }
    }
    return cookie ? cookie.value : null;
  }

  function removeCookie(name, domain = 'local') {
    try {
      const cookies = getCookiesFromStorage();
      const filtered = cookies.filter(c => 
        !(c.name === name && c.domain === domain)
      );
      return saveCookiesToStorage(filtered);
    } catch (e) {
      console.error("Error removing cookie:", e);
      return false;
    }
  }

  function clearCookies(domain = null) {
    try {
      if (domain) {
        const cookies = getCookiesFromStorage();
        const filtered = cookies.filter(c => c.domain !== domain);
        return saveCookiesToStorage(filtered);
      } else {
        localStorage.removeItem(COOKIE_STORE_KEY);
        return true;
      }
    } catch (e) {
      console.error("Error clearing cookies:", e);
      return false;
    }
  }

  function getAllCookies() {
    return getCookiesFromStorage();
  }

  // Session management
  function saveSessionData(key, data) {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSION_STORE_KEY) || '{}');
      sessions[key] = {
        data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(sessions));
      return true;
    } catch (e) {
      console.error("Error saving session:", e);
      return false;
    }
  }

  function getSessionData(key) {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSION_STORE_KEY) || '{}');
      return sessions[key]?.data || null;
    } catch (e) {
      console.error("Error retrieving session:", e);
      return null;
    }
  }

  function clearSessionData(key = null) {
    try {
      if (key) {
        const sessions = JSON.parse(localStorage.getItem(SESSION_STORE_KEY) || '{}');
        delete sessions[key];
        localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(sessions));
      } else {
        localStorage.removeItem(SESSION_STORE_KEY);
      }
      return true;
    } catch (e) {
      console.error("Error clearing session:", e);
      return false;
    }
  }

  // Auto-load document.cookie if available
  function syncBrowserCookies() {
    if (typeof document === 'undefined') return;
    
    try {
      const cookieStr = document.cookie;
      const parsed = parseCookieString(cookieStr);
      parsed.forEach(cookie => {
        addCookie(cookie.name, cookie.value, {
          domain: new URL(window.location.href).hostname
        });
      });
    } catch (e) {
      console.debug("Cookie sync error:", e);
    }
  }

  return {
    addCookie,
    getCookie,
    removeCookie,
    clearCookies,
    getAllCookies,
    getCookiesFromStorage,
    saveCookiesToStorage,
    saveSessionData,
    getSessionData,
    clearSessionData,
    syncBrowserCookies
  };
})();

// Auto-sync cookies on page load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      CookieManager.syncBrowserCookies();
    });
  } else {
    CookieManager.syncBrowserCookies();
  }
}

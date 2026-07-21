// ============ B-BROWSER SETTINGS SYSTEM ============
// Persistent configuration manager for all browser settings

const SettingsManager = (function() {
  const DEFAULT_SETTINGS = {
    // Setup state: 0 = first launch, 1 = setup complete
    setup: 0,
    
    // Display & Theme
    theme: "dark",                    // "dark" or "light"
    scale: 100,                       // 70, 85, 100, 120
    language: "en",                   // "en", "es", "fr", "de", "ja", "zh"
    
    // Search & Navigation
    searchEngine: "google",           // "google", "duckduckgo", "bing", "yahoo", "amazon", "wikipedia"
    autoTranslate: false,             // Auto-translate pages to selected language
    
    // Security & Privacy
    adBlocker: true,                  // Block ads and trackers
    vpn: false,                       // VPN enabled
    proxy: null,                      // Proxy URL (null = disabled)
    securityMode: "standard",         // "standard", "strict", "paranoid"
    saveCookies: true,                // Save cookies between sessions
    
    // Features
    api: true,                        // Enable API access
    gui: "modern",                    // "modern" or "classic"
    aiAssistant: false,               // AI-powered features (ChatGPT integration)
    downloadManager: true,            // Enhanced download management
    
    // Bookmarks & Session
    bookmarks: [
      { title: "Wikipedia", url: "https://en.wikipedia.org" },
      { title: "Hacker News", url: "https://news.ycombinator.com" },
      { title: "Internet Archive", url: "https://archive.org" },
      { title: "Example", url: "https://example.com" }
    ],
    homepage: "https://example.com"
  };

  function getSettings() {
    try {
      const stored = localStorage.getItem("bbrowser-settings");
      if (stored) {
        return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem("bbrowser-settings", JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error("Failed to save settings:", e);
      return false;
    }
  }

  function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    return saveSettings(settings);
  }

  function markSetupComplete() {
    return updateSetting("setup", 1);
  }

  function isSetupComplete() {
    return getSettings().setup === 1;
  }

  return {
    getSettings,
    saveSettings,
    updateSetting,
    markSetupComplete,
    isSetupComplete,
    DEFAULT_SETTINGS
  };
})();

// ============ FEATURE MODULES ============

// Ad Blocker - Blocks known ad domains and tracking scripts
const AdBlocker = {
  blockedDomains: [
    "doubleclick.net", "googlesyndication.com", "googleadservices.com",
    "advertising.com", "ads.com", "adserver.com", "adnetwork.com",
    "analytics.google.com", "facebook.com/tr", "apis.google.com/ads"
  ],
  
  isBlocked(url) {
    if (!SettingsManager.getSettings().adBlocker) return false;
    return this.blockedDomains.some(domain => url.includes(domain));
  },
  
  filterIframe(iframe) {
    // Hook into iframe requests to block ads
    iframe.addEventListener("load", function() {
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          const scripts = doc.querySelectorAll("script[src*='ad'], script[src*='analytics']");
          scripts.forEach(s => s.remove());
        }
      } catch (e) {
        // CORS restrictions - expected for external sites
      }
    });
  }
};

// Security Module - Handles security policies and protections
const SecurityModule = {
  getCSPHeader(mode) {
    const policies = {
      standard: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      strict: "default-src 'self'; script-src 'self'; style-src 'self';",
      paranoid: "default-src 'none'; style-src 'self';"
    };
    return policies[mode] || policies.standard;
  },
  
  validateURL(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (e) {
      return false;
    }
  }
};

// UI Theme Manager - Handles dark/light mode and scaling
const ThemeManager = {
  applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "light") {
      root.style.setProperty("--frame", "#f5f5f7");
      root.style.setProperty("--titlebar", "#e8e8eb");
      root.style.setProperty("--toolbar", "#f1f1f5");
      root.style.setProperty("--sidebar", "#e8e8eb");
      root.style.setProperty("--line", "#d5d5d7");
      root.style.setProperty("--ink", "#1a1a1a");
      root.style.setProperty("--muted", "#6a6a6e");
      root.style.setProperty("--content-bg", "#ffffff");
    } else {
      root.style.setProperty("--frame", "#0d0e10");
      root.style.setProperty("--titlebar", "#17181c");
      root.style.setProperty("--toolbar", "#1d1f24");
      root.style.setProperty("--sidebar", "#17181c");
      root.style.setProperty("--line", "#2a2c32");
      root.style.setProperty("--ink", "#e9eaec");
      root.style.setProperty("--muted", "#8b8f97");
      root.style.setProperty("--content-bg", "#ffffff");
    }
  },
  
  applyScale(scale) {
    document.documentElement.style.fontSize = (scale / 100) * 16 + "px";
    // Also scale the app shell
    const shell = document.getElementById("shell");
    if (shell) shell.style.transform = `scale(${scale / 100})`;
  }
};

// Language/Localization Module
const LanguageModule = {
  translations: {
    en: {
      setupWelcome: "Welcome to B-Browser",
      searchEngine: "Choose your search engine",
      loginRegister: "Login/Register to your B-account",
      settings: "Settings",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      adBlocker: "Ad Blocker",
      vpn: "VPN",
      proxy: "Proxy",
      security: "Security",
      autoTranslate: "Auto Translate",
      aiAssistant: "AI Assistant",
      downloadManager: "Download Manager",
      language: "Language",
      scale: "UI Scale"
    },
    es: {
      setupWelcome: "Bienvenido a B-Browser",
      searchEngine: "Elige tu motor de búsqueda",
      loginRegister: "Inicia sesión / Regístrate en tu cuenta B",
      settings: "Configuración",
      darkMode: "Modo Oscuro",
      lightMode: "Modo Claro",
      adBlocker: "Bloqueador de Anuncios",
      vpn: "VPN",
      proxy: "Proxy",
      security: "Seguridad",
      autoTranslate: "Traducción Automática",
      aiAssistant: "Asistente de IA",
      downloadManager: "Gestor de Descargas",
      language: "Idioma",
      scale: "Escala de UI"
    },
    // Add more languages as needed
  },
  
  getText(key, lang) {
    return (this.translations[lang] || this.translations.en)[key] || key;
  }
};

// VPN/Proxy Manager
const NetworkManager = {
  setProxy(proxyUrl) {
    if (proxyUrl) {
      SettingsManager.updateSetting("proxy", proxyUrl);
      console.log("Proxy set to:", proxyUrl);
    } else {
      SettingsManager.updateSetting("proxy", null);
    }
  },
  
  enableVPN(enabled) {
    SettingsManager.updateSetting("vpn", enabled);
    // In a real app, this would connect to a VPN service
    console.log("VPN " + (enabled ? "enabled" : "disabled"));
  }
};

// Download Manager
const DownloadManager = {
  downloads: [],
  
  addDownload(filename, progress) {
    const download = {
      id: Date.now(),
      filename,
      progress: progress || 0,
      status: "downloading",
      timestamp: new Date()
    };
    this.downloads.push(download);
    return download;
  },
  
  updateProgress(id, progress) {
    const dl = this.downloads.find(d => d.id === id);
    if (dl) dl.progress = Math.min(100, progress);
  },
  
  completeDownload(id) {
    const dl = this.downloads.find(d => d.id === id);
    if (dl) dl.status = "completed";
  },
  
  getDownloads() {
    return this.downloads;
  }
};

// AI Assistant (ChatGPT-like interface placeholder)
const AIAssistant = {
  enabled: false,
  
  enable() {
    if (SettingsManager.getSettings().aiAssistant) {
      this.enabled = true;
      console.log("AI Assistant enabled");
    }
  },
  
  ask(question) {
    if (!this.enabled) return null;
    // Placeholder - would integrate with ChatGPT API
    return "AI Assistant: " + question.toUpperCase();
  }
};

// API Manager - Exposes browser functionality via API
const APIManager = {
  enabled: true,
  
  exposeAPI() {
    if (typeof window !== "undefined" && !window.BBrowserAPI) {
      window.BBrowserAPI = {
        settings: SettingsManager.getSettings,
        updateSetting: SettingsManager.updateSetting,
        getBookmarks: () => SettingsManager.getSettings().bookmarks,
        addBookmark: (title, url) => {
          const settings = SettingsManager.getSettings();
          settings.bookmarks.push({ title, url });
          SettingsManager.saveSettings(settings);
        },
        downloads: DownloadManager.getDownloads,
        ai: AIAssistant.ask
      };
    }
  }
};

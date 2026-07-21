// ============ B-BROWSER AD BLOCKER ============
// Comprehensive ad blocking and performance optimization

const AdBlockEngine = (function() {
  // Comprehensive list of ad and tracking domains
  const BLOCKED_DOMAINS = [
    // Google Ads
    "doubleclick.net", "googlesyndication.com", "googleadservices.com", 
    "google-analytics.com", "analytics.google.com", "googletagmanager.com",
    // Facebook
    "facebook.com/tr", "connect.facebook.net", "facebook.net",
    // Other major ad networks
    "advertising.com", "ads.com", "adserver.com", "adnetwork.com",
    "adform.net", "adnxs.com", "appnexus.com", "contextweb.com",
    "criteo.com", "turn.com", "bidswitch.net", "rubiconproject.com",
    "openx.com", "improvado.io", "adskeeper.com", "adsbidding.com",
    // Analytics & Tracking
    "hotjar.com", "amplitude.com", "segment.com", "mixpanel.com",
    "intercom.io", "drift.com", "mouseflow.com", "fullstory.com",
    "databox.com", "heap.io", "kissmetrics.com",
    // Social media trackers
    "twitter.com/i/", "pinterest.com/v1/", "instagram.com/data/",
    // Malware & suspicious
    "ads-api.com", "adsmind.com", "smartadserver.com",
    // More ad networks
    "yandex.net/ads", "onetag.com", "spotxcdn.com", "connatix.com",
    "taboola.com", "outbrain.com", "revcontent.com", "mgid.com",
    "pubmatic.com", "xaxis.com", "smaato.net", "sonobi.com"
  ];

  const BLOCKED_KEYWORDS = [
    "ads", "advert", "banner", "tracker", "analytics",
    "beacon", "pixel", "telemetry", "collect"
  ];

  function isAdDomain(url) {
    if (!url) return false;
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return BLOCKED_DOMAINS.some(d => domain.includes(d.toLowerCase()));
    } catch (e) {
      return false;
    }
  }

  function isAdScript(src) {
    if (!src) return false;
    const lower = src.toLowerCase();
    return BLOCKED_KEYWORDS.some(keyword => lower.includes(keyword)) ||
           isAdDomain(src);
  }

  function blockIframeAds(iframe) {
    try {
      iframe.addEventListener("load", function() {
        try {
          const doc = iframe.contentDocument;
          if (!doc) return;
          
          // Remove ad-related scripts
          const scripts = doc.querySelectorAll("script[src]");
          scripts.forEach(script => {
            if (isAdScript(script.src)) {
              script.remove();
            }
          });
          
          // Remove ad iframes
          const iframes = doc.querySelectorAll("iframe");
          iframes.forEach(ifr => {
            if (isAdDomain(ifr.src) || isAdScript(ifr.src)) {
              ifr.remove();
            }
          });
          
          // Remove common ad containers
          const adContainers = doc.querySelectorAll(
            "[id*='ad'], [class*='ad'], [id*='banner'], " +
            "[class*='banner'], [data-ad-slot], [data-ad-client]"
          );
          adContainers.forEach(el => {
            if (el.textContent.length < 500) { // Avoid removing main content
              el.style.display = "none";
            }
          });
        } catch (e) {
          // CORS restrictions or other errors - expected for external content
        }
      }, false);
    } catch (e) {
      console.debug("AdBlock: iframe error", e);
    }
  }

  function injectCSPMeta() {
    try {
      const meta = document.createElement("meta");
      meta.httpEquiv = "Content-Security-Policy";
      meta.content = [
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https: ws: wss: data:",
        "default-src 'self' https: data:"
      ].join("; ");
      document.head.insertBefore(meta, document.head.firstChild);
    } catch (e) {
      console.debug("AdBlock: CSP injection error", e);
    }
  }

  function removeInlineAds(doc) {
    try {
      // Remove inline scripts with ad keywords
      const scripts = doc.querySelectorAll("script:not([src])");
      scripts.forEach(script => {
        const content = script.textContent.toLowerCase();
        if (BLOCKED_KEYWORDS.some(kw => content.includes(kw))) {
          // Don't remove tracking if it's analytics we want
          if (!content.includes("_gaq") && !content.includes("_gat")) {
            script.remove();
          }
        }
      });
    } catch (e) {
      console.debug("AdBlock: inline ads removal error", e);
    }
  }

  return {
    isAdDomain,
    isAdScript,
    blockIframeAds,
    injectCSPMeta,
    removeInlineAds,
    getBlockedDomainCount: () => BLOCKED_DOMAINS.length,
    getBlockedKeywordCount: () => BLOCKED_KEYWORDS.length
  };
})();

// Integrate with main iframe loading
if (typeof window !== "undefined") {
  // Hook into iframe creation to apply ad blocking
  const originalCreateElement = document.createElement;
  
  function patchIframe() {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach(ifr => {
      if (!ifr._adblockPatched) {
        AdBlockEngine.blockIframeAds(ifr);
        ifr._adblockPatched = true;
      }
    });
  }

  // Patch on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchIframe);
  } else {
    patchIframe();
  }

  // Watch for dynamically added iframes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.tagName === "IFRAME" && !node._adblockPatched) {
            AdBlockEngine.blockIframeAds(node);
            node._adblockPatched = true;
          }
        });
      }
    });
  });

  try {
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  } catch (e) {
    console.debug("AdBlock: observer setup failed", e);
  }

  // Remove inline ads
  AdBlockEngine.removeInlineAds(document);
}

/**
 * Content script — injects an extension iframe onto the page.
 * The visible card lives inside panel.html (chrome-extension://), so
 * hostile page CSS (e.g. Google Search forcing display:none) cannot hide it.
 *
 * WHERE TO DEBUG: F12 on the PAGE tab (not the service worker).
 */

(function () {
  console.log("[Explain This] content.js executing");

  const HOST_ID = "explain-this-extension-host";
  let currentLang = "en";
  let panelReady = false;
  let pendingMessage = null;
  let styleObserver = null;

  function forceIframeStyle(iframe, lang) {
    const isRtl = lang === "ar";
    // Every property uses !important so page styles cannot win
    const rules = {
      display: "block",
      position: "fixed",
      bottom: "24px",
      top: "auto",
      right: isRtl ? "auto" : "24px",
      left: isRtl ? "24px" : "auto",
      width: "320px",
      "max-width": "calc(100vw - 48px)",
      height: iframe.dataset.etHeight || "120px",
      "min-height": "80px",
      "z-index": "2147483647",
      margin: "0",
      padding: "0",
      border: "none",
      outline: "none",
      background: "transparent",
      opacity: "1",
      visibility: "visible",
      "pointer-events": "auto",
      transform: "none",
      filter: "none",
      overflow: "hidden",
      "box-sizing": "border-box",
      "color-scheme": "light",
      "clip": "auto",
      "clip-path": "none",
      "max-height": "none"
    };

    Object.entries(rules).forEach(([prop, value]) => {
      iframe.style.setProperty(prop, value, "important");
    });
  }

  function postToPanel(message) {
    const iframe = document.getElementById(HOST_ID);
    if (!iframe || !iframe.contentWindow) return;

    if (!panelReady) {
      pendingMessage = message;
      console.log("[Explain This] Panel not ready yet — queued", message.type);
      return;
    }

    iframe.contentWindow.postMessage(
      { source: "explain-this-host", ...message },
      "*"
    );
    console.log("[Explain This] Posted to panel:", message.type);
  }

  function ensureIframe(lang) {
    currentLang = lang || "en";
    let iframe = document.getElementById(HOST_ID);

    if (iframe && iframe.tagName !== "IFRAME") {
      // Remove leftover div host from older builds
      iframe.remove();
      iframe = null;
      panelReady = false;
    }

    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = HOST_ID;
      iframe.src = chrome.runtime.getURL("panel.html");
      iframe.title = "Explain This";
      iframe.setAttribute("allowtransparency", "true");
      forceIframeStyle(iframe, currentLang);

      // If the page strips/changes our style attribute, put it back
      styleObserver = new MutationObserver(() => {
        forceIframeStyle(iframe, currentLang);
      });
      styleObserver.observe(iframe, {
        attributes: true,
        attributeFilter: ["style", "class", "hidden"]
      });

      // Prefer <html> — some sites aggressively rewrite <body>
      (document.documentElement || document.body).appendChild(iframe);
      console.log("[Explain This] Iframe mounted");
    } else {
      forceIframeStyle(iframe, currentLang);
      iframe.hidden = false;
      iframe.removeAttribute("hidden");
    }

    return iframe;
  }

  // Messages from the panel iframe
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== "explain-this-panel") return;

    if (data.type === "READY") {
      panelReady = true;
      console.log("[Explain This] Panel READY");
      if (pendingMessage) {
        const msg = pendingMessage;
        pendingMessage = null;
        postToPanel(msg);
      }
      return;
    }

    if (data.type === "RESIZE" && typeof data.height === "number") {
      const iframe = document.getElementById(HOST_ID);
      if (!iframe) return;
      const h = Math.min(Math.max(data.height + 4, 80), 360);
      iframe.dataset.etHeight = `${h}px`;
      forceIframeStyle(iframe, currentLang);
      return;
    }

    if (data.type === "CLOSE") {
      const iframe = document.getElementById(HOST_ID);
      if (iframe) iframe.remove();
      panelReady = false;
      pendingMessage = null;
      if (styleObserver) {
        styleObserver.disconnect();
        styleObserver = null;
      }
    }
  });

  /**
   * Read saved theme (default: normal) and forward it to the panel iframe
   * so the on-page card matches the popup selection.
   */
  async function handleMessage(message) {
    console.log("[Explain This] content handler received:", message?.type);
    try {
      if (!message || !message.type) {
        return { error: "no message" };
      }

      const stored = await chrome.storage.local.get("theme");
      const theme = stored.theme === "light" || stored.theme === "dark" || stored.theme === "normal"
        ? stored.theme
        : "normal";

      const lang = message.lang || "en";
      ensureIframe(lang);
      postToPanel({ ...message, theme });

      const iframe = document.getElementById(HOST_ID);
      const cs = iframe ? getComputedStyle(iframe) : null;
      return {
        hostExists: Boolean(iframe),
        tag: iframe?.tagName || null,
        hostDisplay: cs?.display || null,
        hostPosition: cs?.position || null,
        theme,
        width: iframe ? iframe.getBoundingClientRect().width : 0,
        height: iframe ? iframe.getBoundingClientRect().height : 0,
        panelReady
      };
    } catch (err) {
      console.error("[Explain This] handleMessage error:", err);
      return { error: String(err) };
    }
  }

  window.__explainThisHandle = handleMessage;

  if (!window.__explainThisInitialized) {
    window.__explainThisInitialized = true;
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      handleMessage(message).then((info) => sendResponse({ ok: true, info }));
      return true; // keep channel open for async response
    });
    console.log("[Explain This] content.js initialized");
  } else {
    console.log("[Explain This] content.js re-injected (handler refreshed)");
  }
})();

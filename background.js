/**
 * Service worker — owns the context menu and Groq API call.
 *
 * WHERE TO DEBUG THIS FILE:
 * chrome://extensions → Explain This → "service worker" / "Inspect views"
 * → that DevTools console (NOT the page's console).
 */

console.log("[Explain This] Service worker loaded");

const LANGUAGE_NAMES = {
  en: "English",
  tr: "Turkish",
  ar: "Arabic"
};

// Recreate the menu cleanly on install/update (avoids duplicate-id errors)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "explain-this",
      title: "Explain This",
      contexts: ["selection"]
    });
    console.log("[Explain This] Context menu created");
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Keep SW alive by returning a promise from an async IIFE
  handleExplainClick(info, tab).catch((err) => {
    console.error("[Explain This] Unhandled error in click handler:", err);
  });
});

async function handleExplainClick(info, tab) {
  console.log("[Explain This] Context menu clicked", {
    menuItemId: info.menuItemId,
    hasSelection: Boolean(info.selectionText),
    tabId: tab?.id,
    tabUrl: tab?.url
  });

  if (info.menuItemId !== "explain-this") return;

  const selectedText = info.selectionText;
  if (!selectedText) {
    console.error("[Explain This] No selected text on click info");
    return;
  }
  if (!tab?.id) {
    console.error("[Explain This] No tab id — cannot inject into page", tab);
    return;
  }

  const { apiKey, language } = await chrome.storage.local.get(["apiKey", "language"]);
  const lang = language || "en";
  console.log("[Explain This] Preferences", { lang, hasApiKey: Boolean(apiKey) });

  // Inject content.js, then drive the UI via executeScript (more reliable than
  // sendMessage right after a fresh inject).
  try {
    await injectContentScript(tab.id);
  } catch (err) {
    console.error("[Explain This] Failed to inject content.js into tab", tab.id, err);
    return;
  }

  await tellContentScript(tab.id, { type: "SHOW_LOADING", lang });

  if (!apiKey) {
    console.warn("[Explain This] No API key saved");
    await tellContentScript(tab.id, { type: "SHOW_ERROR", lang, messageKey: "noKey" });
    return;
  }

  try {
    const explanation = await getExplanation(selectedText, apiKey, lang);
    console.log("[Explain This] Got explanation, length:", explanation.length);
    await tellContentScript(tab.id, { type: "SHOW_RESULT", lang, text: explanation });
  } catch (err) {
    console.error("[Explain This] API / explain failed:", err);
    await tellContentScript(tab.id, {
      type: "SHOW_ERROR",
      lang,
      messageKey: "error",
      customMessage: err?.message || undefined
    });
  }
}

/** Inject CSS that page stylesheets cannot easily override, then content.js. */
async function injectContentScript(tabId) {
  console.log("[Explain This] Injecting CSS + content.js into tab", tabId);

  // Extension-injected !important CSS — fights Google hiding our host
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      css: `
        #explain-this-extension-host {
          display: block !important;
          position: fixed !important;
          bottom: 24px !important;
          top: auto !important;
          right: 24px !important;
          left: auto !important;
          width: 320px !important;
          max-width: calc(100vw - 48px) !important;
          min-height: 80px !important;
          z-index: 2147483647 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          transform: none !important;
          filter: none !important;
          clip: auto !important;
          clip-path: none !important;
          overflow: hidden !important;
        }
        #explain-this-extension-host[hidden] {
          display: block !important;
        }
      `
    });
  } catch (err) {
    console.warn("[Explain This] insertCSS failed (continuing):", err);
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
  console.log("[Explain This] content.js inject finished");
}

/**
 * Deliver a message to the content script.
 * Prefer calling window.__explainThisHandle via executeScript so we don't
 * depend on chrome.tabs.sendMessage timing after a fresh inject.
 */
async function tellContentScript(tabId, message) {
  console.log("[Explain This] Telling content script:", message.type, "tab", tabId);
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (msg) => {
        if (typeof window.__explainThisHandle !== "function") {
          return { ok: false, reason: "handler missing" };
        }
        // handleMessage is async (reads theme from storage)
        const info = await window.__explainThisHandle(msg);
        const host = document.getElementById("explain-this-extension-host");
        const cs = host ? getComputedStyle(host) : null;
        const rect = host ? host.getBoundingClientRect() : null;
        return {
          ok: true,
          info,
          hostExists: Boolean(host),
          tag: host?.tagName || null,
          hostDisplay: cs?.display || null,
          hostPosition: cs?.position || null,
          rect: rect
            ? { w: rect.width, h: rect.height, top: rect.top, left: rect.left }
            : null
        };
      },
      args: [message]
    });
    console.log("[Explain This] Content script call result:", results?.[0]?.result);
  } catch (err) {
    console.error("[Explain This] tellContentScript failed:", err);
  }
}

async function getExplanation(text, apiKey, lang) {
  const languageName = LANGUAGE_NAMES[lang] || "English";
  console.log("[Explain This] Calling Groq API…");

  let response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "user",
            content: `Explain the following text simply, in 2-3 short sentences, in ${languageName}:\n\n"${text}"`
          }
        ]
      })
    });
  } catch (err) {
    console.error("[Explain This] fetch() threw:", err);
    throw new Error("Network error talking to Groq.");
  }

  console.log("[Explain This] Groq HTTP status:", response.status);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error("[Explain This] Failed to parse JSON:", err);
    throw new Error("Invalid response from Groq.");
  }

  console.log("[Explain This] Groq response keys:", Object.keys(data || {}));

  if (!response.ok || data.error) {
    const msg = data?.error?.message || `Request failed (${response.status})`;
    throw new Error(msg);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from the model.");
  }

  return content;
}

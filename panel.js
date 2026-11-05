/**
 * Runs inside the extension iframe (chrome-extension://…).
 * Receives SHOW_* messages (with lang + theme) via postMessage from content.js.
 */

const STRINGS = {
  en: {
    title: "Explanation",
    close: "Close",
    thinking: "Thinking…",
    noKey: "No API key set. Open the extension popup and save your Groq key.",
    error: "Something went wrong. Please try again."
  },
  tr: {
    title: "Açıklama",
    close: "Kapat",
    thinking: "Düşünülüyor…",
    noKey: "API anahtarı ayarlanmamış. Eklenti penceresini açıp Groq anahtarınızı kaydedin.",
    error: "Bir şeyler ters gitti. Lütfen tekrar deneyin."
  },
  ar: {
    title: "الشرح",
    close: "إغلاق",
    thinking: "جارٍ التفكير…",
    noKey: "لم يتم تعيين مفتاح API. افتح نافذة الإضافة واحفظ مفتاح Groq.",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى."
  }
};

const card = document.getElementById("card");
const titleEl = document.getElementById("title");
const bodyEl = document.getElementById("body");
const closeBtn = document.getElementById("closeBtn");

function t(lang) {
  return STRINGS[lang] || STRINGS.en;
}

function applyPanelTheme(theme) {
  if (window.ExplainThisThemes) {
    ExplainThisThemes.applyTheme(document.documentElement, theme || "normal");
  }
}

function setChrome(lang) {
  const s = t(lang);
  const isRtl = lang === "ar";
  card.setAttribute("dir", isRtl ? "rtl" : "ltr");
  document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
  titleEl.textContent = s.title;
  closeBtn.title = s.close;
  closeBtn.setAttribute("aria-label", s.close);
  return s;
}

function showLoading(lang, theme) {
  applyPanelTheme(theme);
  const s = setChrome(lang);
  bodyEl.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "et-loading";
  const spinner = document.createElement("div");
  spinner.className = "et-spinner";
  const label = document.createElement("span");
  label.textContent = s.thinking;
  wrap.append(spinner, label);
  bodyEl.appendChild(wrap);
  notifyResize();
}

function showResult(lang, text, theme) {
  applyPanelTheme(theme);
  setChrome(lang);
  const p = document.createElement("p");
  p.className = "et-text";
  p.textContent = text || "";
  bodyEl.replaceChildren(p);
  notifyResize();
}

function showError(lang, messageKey, customMessage, theme) {
  applyPanelTheme(theme);
  const s = setChrome(lang);
  let message = customMessage;
  if (!message) {
    message = messageKey === "noKey" ? s.noKey : s.error;
  }
  const p = document.createElement("p");
  p.className = "et-error";
  p.textContent = message;
  bodyEl.replaceChildren(p);
  notifyResize();
}

function notifyResize() {
  const height = Math.ceil(document.body.scrollHeight);
  parent.postMessage({ source: "explain-this-panel", type: "RESIZE", height }, "*");
}

closeBtn.addEventListener("click", () => {
  parent.postMessage({ source: "explain-this-panel", type: "CLOSE" }, "*");
});

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.source !== "explain-this-host") return;

  const theme = data.theme || "normal";

  if (data.type === "SHOW_LOADING") showLoading(data.lang || "en", theme);
  else if (data.type === "SHOW_RESULT") showResult(data.lang || "en", data.text, theme);
  else if (data.type === "SHOW_ERROR") {
    showError(data.lang || "en", data.messageKey, data.customMessage, theme);
  }
});

// Default to Normal until the first message arrives with a theme
applyPanelTheme("normal");
parent.postMessage({ source: "explain-this-panel", type: "READY" }, "*");

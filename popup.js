/**
 * Popup UI — API key, language, and theme preferences.
 * All values live in chrome.storage.local.
 */

const input = document.getElementById("apiKeyInput");
const saveBtn = document.getElementById("saveBtn");
const keyStatus = document.getElementById("keyStatus");
const langButtons = document.querySelectorAll(".lang-btn");
const themeButtons = document.querySelectorAll(".theme-btn");

function renderKeyStatus(hasKey) {
  const textEl = keyStatus.querySelector(".text");
  if (hasKey) {
    keyStatus.classList.add("has-key");
    textEl.textContent = "Key saved";
  } else {
    keyStatus.classList.remove("has-key");
    textEl.textContent = "No key set";
  }
}

function renderLanguage(lang) {
  langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

/** Apply CSS variables + highlight the active theme pill */
function renderTheme(theme) {
  const name = ExplainThisThemes.applyTheme(document.documentElement, theme);
  themeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === name);
  });
}

// Load settings when the popup opens (default theme = normal)
chrome.storage.local.get(["apiKey", "language", "theme"], (data) => {
  renderKeyStatus(Boolean(data.apiKey));
  renderLanguage(data.language || "en");
  renderTheme(data.theme || "normal");
});

saveBtn.addEventListener("click", async () => {
  const key = input.value.trim();
  if (!key) return;

  await chrome.storage.local.set({ apiKey: key });
  input.value = "";
  renderKeyStatus(true);
});

langButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const lang = btn.dataset.lang;
    await chrome.storage.local.set({ language: lang });
    renderLanguage(lang);
  });
});

themeButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const theme = btn.dataset.theme;
    await chrome.storage.local.set({ theme });
    renderTheme(theme);
  });
});

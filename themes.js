/**
 * Shared theme tokens for popup + on-page panel.
 * Apply with: applyTheme(document.documentElement, "normal"|"light"|"dark")
 */
(function (global) {
  const THEMES = {
    // Default — full Qatar Airways burgundy identity
    normal: {
      "--et-bg": "#FFFFFF",
      "--et-surface": "#F5F5F5",
      "--et-text": "#333333",
      "--et-text-muted": "#6E6E6E",
      "--et-border": "#D0D0D0",
      "--et-divider": "#EBEBEB",
      "--et-header-bg": "#5C0632",
      "--et-header-text": "#FFFFFF",
      "--et-accent": "#5C0632",
      "--et-accent-hover": "#470725",
      "--et-on-accent": "#FFFFFF",
      "--et-card-bg": "#FFFFFF",
      "--et-card-shadow": "0 4px 20px rgba(0, 0, 0, 0.18)",
      "--et-spinner-track": "#E0E0E0",
      "--et-error-text": "#8B3A3A",
      "--et-error-bg": "#FDF6F6",
      "--et-error-border": "#E8C8C8",
      "--et-ok": "#2E7D4F"
    },

    // Light — white/gray surfaces; burgundy only as accent
    light: {
      "--et-bg": "#FFFFFF",
      "--et-surface": "#F5F5F5",
      "--et-text": "#1A1A1A",
      "--et-text-muted": "#6E6E6E",
      "--et-border": "#D8D8D8",
      "--et-divider": "#EEEEEE",
      "--et-header-bg": "#F5F5F5",
      "--et-header-text": "#1A1A1A",
      "--et-accent": "#5C0632",
      "--et-accent-hover": "#470725",
      "--et-on-accent": "#FFFFFF",
      "--et-card-bg": "#FFFFFF",
      "--et-card-shadow": "0 4px 16px rgba(0, 0, 0, 0.10)",
      "--et-spinner-track": "#E0E0E0",
      "--et-error-text": "#8B3A3A",
      "--et-error-bg": "#FDF6F6",
      "--et-error-border": "#E8C8C8",
      "--et-ok": "#2E7D4F"
    },

    // Dark — charcoal surfaces; brighter burgundy accents for contrast
    dark: {
      "--et-bg": "#1A1A1A",
      "--et-surface": "#2A2A2A",
      "--et-text": "#F0F0F0",
      "--et-text-muted": "#A0A0A0",
      "--et-border": "#404040",
      "--et-divider": "#333333",
      "--et-header-bg": "#121212",
      "--et-header-text": "#F0F0F0",
      "--et-accent": "#7A0A42",
      "--et-accent-hover": "#5C0632",
      "--et-on-accent": "#FFFFFF",
      "--et-card-bg": "#242424",
      "--et-card-shadow": "0 4px 20px rgba(0, 0, 0, 0.45)",
      "--et-spinner-track": "#404040",
      "--et-error-text": "#E8A0A0",
      "--et-error-bg": "#3A2222",
      "--et-error-border": "#6B3A3A",
      "--et-ok": "#5CB87A"
    }
  };

  function normalizeTheme(theme) {
    if (theme === "light" || theme === "dark" || theme === "normal") return theme;
    return "normal";
  }

  function applyTheme(root, theme) {
    const name = normalizeTheme(theme);
    const vars = THEMES[name];
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.setAttribute("data-theme", name);
    return name;
  }

  global.ExplainThisThemes = { THEMES, normalizeTheme, applyTheme };
})(typeof window !== "undefined" ? window : self);

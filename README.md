# Explain This

A Chrome extension that lets you highlight any text on any webpage, right-click, and get an instant AI-generated explanation — rendered directly on the page, in the language of your choice.

## Features

- **Right-click to explain** — select text anywhere on the web, right-click, choose "Explain This"
- **On-page results** — explanations appear in a floating card on the page itself, not in a separate console or tab
- **Multilingual** — supports English, Turkish (Türkçe), and Arabic (العربية), with correct right-to-left rendering for Arabic
- **Light / Dark / Normal themes** — choose a clean light mode, a dark mode, or the default Qatar Airways–inspired burgundy identity
- **Secure key storage** — your API key is stored locally in the browser via `chrome.storage.local`, never hardcoded or transmitted anywhere except directly to the model provider
- **Custom branding** — extension icon and in-popup logo can be swapped for your own image

## Tech Stack

- Chrome Extensions API (Manifest V3)
- JavaScript (background service worker + content script)
- Groq API (`openai/gpt-oss-20b`) for AI-generated explanations
- HTML/CSS for the popup and on-page result card

## Project Structure

```
explain-this-extension/
├── manifest.json       # Extension configuration (permissions, icons, entry points)
├── background.js       # Service worker — right-click menu, API calls
├── content.js           # Injects the result card onto the webpage
├── popup.html           # Settings UI — API key, language, theme
├── popup.js              # Popup logic — saving preferences
├── icon16.png
├── icon48.png
└── icon128.png
```

## Setup

1. Clone or download this repository.
2. Go to `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this project's folder.
5. Click the extension's icon in your toolbar, paste in a [Groq API key](https://console.groq.com) (free tier available), and save.
6. Select your preferred language and theme in the popup.

## Usage

1. Highlight any text on a webpage.
2. Right-click and select **Explain This**.
3. A card appears on the page with a plain-language explanation, in your chosen language.

## License

MIT

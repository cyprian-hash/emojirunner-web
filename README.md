# emojirunner-web

Marketing site for [Emoji Runner](https://apps.apple.com/us/app/emoji-runner/id973972975) — a one-tap endless runner for iPhone, iPad, Mac, and Apple Vision.

Live at **[emojirunner.com](https://emojirunner.com)**.

## Stack

Plain HTML / CSS / JS. No build step. No framework. Space Grotesk via Google Fonts.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to Hostinger

1. Open Hostinger File Manager → `public_html/`
2. Upload everything in this folder (or zip and extract)
3. `index.html`, `privacy.html`, `support.html` must live at the web root

## Structure

| File | Purpose |
|---|---|
| `index.html` | Landing page |
| `privacy.html` | Privacy policy |
| `support.html` | FAQ + contact |
| `style.css` | Main stylesheet |
| `legal.css` | Privacy / Support page styles |
| `script.js` | Scroll reveal + parallax |
| `assets/` | Logo, icon, character sprites, rendered gameplay screenshots |

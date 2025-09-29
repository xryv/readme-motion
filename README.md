> *the answer was already known before you asked, but only if you knew what to listen for.*

<!-- ========================= HERO ========================= -->
<p align="center">
  <img src="assets/typing.svg" alt="readme-motion — typewriter hero" width="720">
</p>

<h1 align="center">readme-motion</h1>
<p align="center">
  Generate gorgeous, dependency-free <b>animated SVGs</b> for your GitHub README from a tiny JSON file.<br/>
  <i>No server. No build chain. Just commit and use.</i>
</p>

<p align="center">
  <a href="https://github.com/xryv/readme-motion/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/xryv/readme-motion?style=for-the-badge"></a>
  <a href="https://github.com/xryv/readme-motion/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/xryv/readme-motion/readme-motion.yml?style=for-the-badge&label=build"></a>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-777?style=for-the-badge">
  <img alt="No deps" src="https://img.shields.io/badge/deps-0-00E5FF?style=for-the-badge">
</p>

---

## ✨ Demo Gallery (one-shot showcase)

<!-- Titles + assets neatly centered and shown ONCE -->

<p align="center"><b>Typing Headline</b></p>
<p align="center">
  <img src="assets/typing.svg" alt="Typing animation" width="720">
</p>

<p align="center"><b>Build Progress</b></p>
<p align="center">
  <img src="assets/progress-build.svg" alt="Progress bar" width="720">
</p>

<p align="center"><b>Status Badge</b></p>
<p align="center">
  <img src="assets/badge-status.svg" alt="Status badge" width="320">
</p>

<p align="center"><b>Stars Counter</b></p>
<p align="center">
  <img src="assets/counter-stars.svg" alt="Odometer counter" width="320">
</p>

<p align="center"><b>Commits Sparkline</b></p>
<p align="center">
  <img src="assets/sparkline-commits.svg" alt="Sparkline" width="720">
</p>

<p align="center"><b>Now Playing Ticker</b></p>
<p align="center">
  <img src="assets/ticker-nowplaying.svg" alt="Ticker" width="720">
</p>

---

## 🔧 Why this?
- **Search-friendly** keywords: “README animation”, “typing svg”, “progress badge”.
- **Local-first**: renders static SVGs into `/assets`, works on GitHub instantly.
- **Zero dependencies**: pure Node + inline SVG/SMIL.
- **One config**: describe visuals in `motion.config.json`.

---

## 🚀 Quick start
```bash
# global (optional)
npm i -g readme-motion

# scaffold sample config + themes
readme-motion --init

# generate from config (local or CI)
npx readme-motion --config motion.config.json
# or
node cli/index.js --config motion.config.json

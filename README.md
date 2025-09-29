<!-- Hero -->
<p align="center">
  <img src="assets/typing.svg" alt="readme-motion typewriter" width="600">
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

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#features">Features</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#generators">Generators</a> ·
  <a href="#theming">Theming</a> ·
  <a href="#github-action-optional">GitHub Action</a> ·
  <a href="#faq">FAQ</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

---

> Repo: https://github.com/xryv/readme-motion

## Why?
- **Search-friendly**: people look for “README animation”, “typing svg”, “progress badge”.
- **Local-first**: renders SVGs into `/assets` and you reference them directly in your README.
- **No dependencies**: pure Node + inline SVG/CSS/SMIL. Works on GitHub without hosting.
- **One config**: describe visuals in `motion.config.json` and generate with one command.

---

## Quick start

```bash
# global (optional)
npm i -g readme-motion

# scaffold a sample config and themes
readme-motion --init

# or run from the repo locally:
npx readme-motion --config motion.config.json
# or
node cli/index.js --config motion.config.json

# readme-motion

> Generate gorgeous, dependency-free animated SVGs for your GitHub README from a tiny JSON file. No server. No build chain. Just commit and use.

https://github.com/xryv/readme-motion

---

## Why?

- **Search-friendly:** “README animation”, “typing svg”, “progress badge”.
- **Local-first:** Renders SVGs into `/assets` – referenced directly in your README.
- **No dependencies:** Pure Node + inline SVG/CSS/SMIL animations.
- **One config:** Describe what you want in `motion.config.json`.

---

## Quick start

```bash
npm i -g readme-motion
# or run locally with: npx readme-motion --config motion.config.json
readme-motion --init           # scaffolds a sample config
readme-motion --config motion.config.json

![Typing](assets/typing.svg)

![Build Progress](assets/progress-build.svg)

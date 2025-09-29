#!/usr/bin/env node
/**
 * readme-motion CLI (v0.2.0)
 * New in this version:
 *  - Themes (dark, industrial, light) via themes.json or per-item overrides
 *  - Generators: badge, counter (odometer), sparkline, ticker
 *  - Easter egg: "wizard" spark overlay (set "easterEgg":"wizard" in config)
 *  - Still dependency-free, pure Node, pure SVG+SMIL/CSS.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ------------------------------ utils ---------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--config') opts.config = args[++i];
    else if (a === '--init') opts.init = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function writeFileSafe(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`✔ wrote ${path.relative(process.cwd(), targetPath)}`);
}

function escapeXML(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function loadThemes() {
  const root = process.cwd();
  const p = path.resolve(root, 'themes.json');
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  // fallback default (dark-ish)
  return {
    dark: { bg:'#0d1117', text:'#E6EDF3', muted:'#6B7280', accent:'#00E5FF', track:'#1f2937', good:'#10B981', warn:'#F59E0B', bad:'#EF4444' }
  };
}

function resolveColors(cfg, item) {
  const themes = loadThemes();
  const themeName = (item.theme || cfg.theme || 'dark');
  const t = themes[themeName] || themes.dark;

  // item-local overrides win
  return {
    bg: item.bg ?? t.bg,
    text: item.textColor ?? item.text ?? t.text,
    muted: item.muted ?? t.muted,
    accent: item.accent ?? t.accent,
    track: item.trackColor ?? item.track ?? t.track,
    good: item.good ?? t.good,
    warn: item.warn ?? t.warn,
    bad: item.bad ?? t.bad
  };
}

function maybeWizardOverlay(cfg, width, height) {
  if (!cfg || cfg.easterEgg !== 'wizard') return '';
  // tiny sparkle path with gentle rotation
  const cx = width - 24;
  const cy = 24;
  return `
  <!-- wizard mode ✨ -->
  <g transform="translate(${cx},${cy})">
    <g>
      <path d="M0,-6 L1.8,-1.8 L6,0 L1.8,1.8 L0,6 L-1.8,1.8 L-6,0 L-1.8,-1.8 Z"
            fill="none" stroke="#FFD166" stroke-width="1.2">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite"/>
      </path>
      <circle r="1.6" fill="#FFD166">
        <animate attributeName="opacity" values="0;1;0" dur="2.2s" repeatCount="indefinite"/>
      </circle>
    </g>
  </g>`;
}

// --------------------------- generators -------------------------------------

function genTypewriterSVG(cfg, o) {
  const width = o.width ?? 600;
  const height = o.height ?? 60;
  const fontFamily = escapeXML(o.fontFamily ?? 'Inter, Segoe UI, Roboto, Arial');
  const fontSize = o.fontSize ?? 26;
  const { bg, text: textColor, accent: cursorColor } = resolveColors(cfg, o);
  const lines = Array.isArray(o.lines) && o.lines.length ? o.lines : ['readme-motion'];
  const speedMs = Math.max(10, o.speedMs ?? 60);
  const pauseMs = Math.max(200, o.pauseMs ?? 1200);
  const textY = Math.floor(height * 0.67);
  const cursorWidth = 2;

  const totalDur = lines.reduce((sum, l) => sum + (l.length * speedMs)/1000 + (pauseMs/1000), 0);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <style>
    .tw { font: ${fontSize}px ${fontFamily}; fill: ${textColor}; }
  </style>

  ${lines.map((line, idx) => {
    const chars = [...line];
    const typeDur = (chars.length * speedMs) / 1000;
    const begin = lines.slice(0, idx).reduce((acc, l) => acc + (l.length * speedMs)/1000 + (pauseMs/1000), 0);
    const padX = 16;
    const approxCharW = fontSize * 0.6;
    const endX = padX + approxCharW * chars.length;

    return `
    <g>
      <text class="tw" x="${padX}" y="${textY}">${escapeXML(line)}</text>
      <clipPath id="clip-${idx}">
        <rect x="0" y="0" width="0" height="${height}">
          <animate attributeName="width" dur="${typeDur}s" begin="${begin}s" fill="freeze" from="0" to="${endX + 4}" />
        </rect>
      </clipPath>
      <g clip-path="url(#clip-${idx})">
        <rect x="${endX}" y="${textY - fontSize + 4}" width="${cursorWidth}" height="${fontSize + 6}" fill="${cursorColor}">
          <animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite" />
          <set attributeName="visibility" to="visible" begin="${begin}s" />
          <set attributeName="visibility" to="hidden" begin="${begin + typeDur + (pauseMs/1000)}s" />
        </rect>
      </g>
      <set attributeName="visibility" to="visible" begin="${begin}s" />
      <set attributeName="visibility" to="hidden" begin="${begin + typeDur + (pauseMs/1000)}s" />
    </g>`;
  }).join('\n')}

  <animate id="loop" attributeName="visibility" from="visible" to="visible" begin="0s;loop.end" dur="${totalDur}s" />
  ${maybeWizardOverlay(cfg, width, height)}
</svg>`;
  return svg;
}

function genProgressSVG(cfg, o) {
  const width = o.width ?? 600;
  const height = o.height ?? 60;
  const { bg, track, accent, text } = resolveColors(cfg, o);
  const label = o.label ?? 'Progress';
  const percent = clamp(Number(o.percent ?? 0), 0, 100);
  const pad = 12;
  const innerW = width - pad*2;
  const innerH = height - pad*2 - 18;
  const barW = innerW * (percent/100);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="${pad}" y="${pad + 14}" font-family="Inter, Segoe UI, Roboto, Arial" font-size="14" fill="${text}">${escapeXML(label)} — ${percent}%</text>
  <rect x="${pad}" y="${pad + 18}" rx="6" ry="6" width="${innerW}" height="${innerH}" fill="${track}"/>
  <rect x="${pad}" y="${pad + 18}" rx="6" ry="6" width="0" height="${innerH}" fill="${accent}">
    <animate attributeName="width" from="0" to="${barW}" dur="1.2s" fill="freeze"/>
  </rect>
  ${maybeWizardOverlay(cfg, width, height)}
</svg>`;
}

function genBadgeSVG(cfg, o) {
  const width = o.width ?? 180;
  const height = o.height ?? 36;
  const { bg, text, good, warn, bad, accent, track } = resolveColors(cfg, o);
  const tone = (o.tone || 'good');
  const color = tone === 'warn' ? warn : (tone === 'bad' ? bad : good);
  const label = o.label ?? 'Status';
  const value = o.value ?? 'OK';
  const pulse = !!o.pulse;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${track}"/>
      <stop offset="1" stop-color="${bg}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="8" ry="8" fill="url(#g)"/>
  <text x="12" y="${Math.round(height*0.62)}" font-family="Inter, Segoe UI, Roboto, Arial" font-size="13" fill="${text}" opacity="0.8">${escapeXML(label)}</text>
  <g>
    <rect x="${width-88}" y="${(height-24)/2}" rx="6" ry="6" width="76" height="24" fill="${color}" opacity="0.18"/>
    <text x="${width-50}" text-anchor="middle" y="${Math.round(height*0.62)}" font-family="Inter, Segoe UI, Roboto, Arial" font-size="13" fill="${color}" font-weight="700">${escapeXML(value)}</text>
    ${pulse ? `<circle cx="${width-12}" cy="12" r="4" fill="${color}">
      <animate attributeName="r" values="3;5;3" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite"/>
    </circle>` : ''}
  </g>
  ${maybeWizardOverlay(cfg, width, height)}
</svg>`;
}

function genCounterSVG(cfg, o) {
  const width = o.width ?? 220;
  const height = o.height ?? 48;
  const { bg, text, accent, track } = resolveColors(cfg, o);
  const label = o.label ?? 'Counter';
  const from = Math.max(0, parseInt(o.from ?? 0, 10));
  const to = Math.max(0, parseInt(o.to ?? 0, 10));
  const digits = Math.max(1, parseInt(o.digits ?? String(Math.max(from, to)).length, 10));
  const duration = Math.max(200, parseInt(o.durationMs ?? 1200, 10)) / 1000;

  const pad = 10;
  const areaW = width - pad*2;
  const slotW = Math.floor((areaW - 8 - 70) / digits); // leave space for label
  const xStart = pad + 70;

  const targetStr = String(to).padStart(digits, '0');
  const startStr = String(from).padStart(digits, '0');

  function digitColumn(x, fromD, toD, idx) {
    // a stack 0..9, animate translateY to target
    const h = 28;
    const gap = 4;
    const totalH = (h + gap) * 10;
    const fromY = - (h + gap) * fromD;
    const toY   = - (h + gap) * toD;

    return `
    <g transform="translate(${x}, ${Math.round(height*0.65)})">
      <clipPath id="clipd${idx}">
        <rect x="-2" y="${-h}" width="${slotW}" height="${h+6}"/>
      </clipPath>
      <g clip-path="url(#clipd${idx})">
        <g>
          ${Array.from({length:10}, (_,n)=>`<text x="0" y="${-n*(h+gap)}" font-family="Menlo, Consolas, monospace" font-size="${h}" fill="${text}">${n}</text>`).join('\n')}
          <animateTransform attributeName="transform" type="translate" dur="${duration}s" fill="freeze"
            from="0 ${fromY}" to="0 ${toY}"/>
        </g>
      </g>
      <rect x="-3" y="${-h-3}" width="${slotW+6}" height="${h+10}" fill="none" stroke="${track}" rx="6" ry="6"/>
    </g>`;
  }

  const columns = targetStr.split('').map((d, i) => {
    const x = xStart + i * (slotW + 6);
    return digitColumn(x, parseInt(startStr[i],10), parseInt(d,10), i);
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="${pad}" y="${Math.round(height*0.62)}" font-family="Inter, Segoe UI, Roboto, Arial" font-size="14" fill="${text}" opacity="0.85">${escapeXML(label)}</text>
  ${columns}
  ${maybeWizardOverlay(cfg, width, height)}
</svg>`;
}

function genSparklineSVG(cfg, o) {
  const width = o.width ?? 600;
  const height = o.height ?? 80;
  const { bg, text, accent, track } = resolveColors(cfg, o);
  const data = Array.isArray(o.data) && o.data.length ? o.data : [1,2,3,2,4,5,3,6,7];
  const label = o.label ?? 'Sparkline';

  // Scale
  const pad = 10;
  const w = width - pad*2;
  const h = height - pad*2 - 16;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i/(data.length-1)) * w;
    const y = pad + 16 + (1 - (v - min)/range) * h;
    return [x,y];
  });

  const d = pts.map((p, i) => (i===0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const lengthApprox = Math.hypot(w, h) + data.length * 8; // rough

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="${pad}" y="${pad + 12}" font-family="Inter, Segoe UI, Roboto, Arial" font-size="12" fill="${text}" opacity="0.8">${escapeXML(label)}</text>
  <path d="${d}" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${lengthApprox}" stroke-dashoffset="${lengthApprox}">
    <animate attributeName="stroke-dashoffset" from="${lengthApprox}" to="0" dur="1.4s" fill="freeze"/>
  </path>
  ${maybeWizardOverlay(cfg, width, height)}
</svg>`;
}

function genTickerSVG(cfg, o) {
  const width = o.width ?? 600;
  const height = o.height ?? 36;
  const { bg, text, accent } = resolveColors(cfg, o);
  const content = o.text ?? 'readme-motion · ticker';
  const speed = Math.max(20, o.speed ?? 50); // px/s
  const pad = 10;
  const y = Math.round(height * 0.65);
  const repeatGap = 40;
  const totalW = width + content.length * 10 + repeatGap;

  // Move group from right to left and loop
  const dur = (totalW + width) / speed;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g>
    <g id="marquee" transform="translate(${width},0)">
      <text x="0" y="${y}" font-family="Inter, Segoe UI, Roboto, Arial" font-size="14" fill="${text}">
        ${escapeXML(content)}   •   ${escapeXML(content)}   •   ${escapeXML(content)}
      </text>
      <animateTransform attributeName="transform" type="translate" from="${width} 0" to="${-totalW} 0" dur="${dur}s" repeatCount="indefinite"/>
    </g>
  </g>
  ${maybeWizardOverlay(cfg, width, height)}
</svg>`;
}

// ------------------------------ main ----------------------------------------

function initScaffold() {
  const sample = {
    theme: "dark",
    outDir: "assets",
    items: [
      { type: "typewriter", file: "typing.svg", lines: ["Hello, world!", "Welcome to readme-motion."], speedMs: 70, pauseMs: 1000 },
      { type: "progress", file: "progress-demo.svg", label: "Demo Progress", percent: 42 }
    ]
  };
  writeFileSafe(path.resolve(process.cwd(), 'motion.config.json'), JSON.stringify(sample, null, 2));
  // also drop themes.json
  const themes = {
    dark: { bg:'#0d1117', text:'#E6EDF3', muted:'#6B7280', accent:'#00E5FF', track:'#1f2937', good:'#10B981', warn:'#F59E0B', bad:'#EF4444' }
  };
  writeFileSafe(path.resolve(process.cwd(), 'themes.json'), JSON.stringify(themes, null, 2));
}

function showHelp() {
  console.log(`
readme-motion
  --init                    Scaffold a sample motion.config.json + themes.json
  --config <file>          Render SVGs defined in the given config
  -h, --help               Show help

Types: typewriter, progress, badge, counter, sparkline, ticker
`);
}

async function main() {
  const opts = parseArgs();
  if (opts.help || (!opts.init && !opts.config)) {
    showHelp();
    process.exit(0);
  }

  if (opts.init) {
    initScaffold();
    process.exit(0);
  }

  const cfgPath = path.resolve(process.cwd(), opts.config);
  if (!fs.existsSync(cfgPath)) {
    console.error(`Config not found: ${cfgPath}`);
    process.exit(1);
  }

  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const outDir = path.resolve(process.cwd(), cfg.outDir || 'assets');
  fs.mkdirSync(outDir, { recursive: true });

  for (const item of cfg.items || []) {
    const file = item.file || `${item.type}.svg`;
    let svg = '';
    switch (item.type) {
      case 'typewriter': svg = genTypewriterSVG(cfg, item); break;
      case 'progress':   svg = genProgressSVG(cfg, item); break;
      case 'badge':      svg = genBadgeSVG(cfg, item); break;
      case 'counter':    svg = genCounterSVG(cfg, item); break;
      case 'sparkline':  svg = genSparklineSVG(cfg, item); break;
      case 'ticker':     svg = genTickerSVG(cfg, item); break;
      default:
        console.warn(`Skipping unknown type: ${item.type}`);
        continue;
    }
    writeFileSafe(path.join(outDir, file), svg);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

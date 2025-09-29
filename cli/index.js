#!/usr/bin/env node
/**
 * readme-motion CLI (v0.1.0)
 * Dependency-free SVG generator for README animations.
 * Usage:
 *   readme-motion --init
 *   readme-motion --config motion.config.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  console.log(`✔ wrote ${targetPath}`);
}

function initScaffold() {
  const sample = {
    outDir: "assets",
    items: [
      {
        type: "typewriter",
        file: "typing.svg",
        width: 600,
        height: 60,
        fontFamily: "Inter, Segoe UI, Roboto, Arial",
        fontSize: 26,
        textColor: "#E6EDF3",
        cursorColor: "#00E5FF",
        bg: "transparent",
        lines: ["Hello, world!", "Welcome to readme-motion."],
        speedMs: 70,
        pauseMs: 1000
      },
      {
        type: "progress",
        file: "progress-demo.svg",
        width: 600,
        height: 60,
        bg: "#0d1117",
        barColor: "#00E5FF",
        trackColor: "#1f2937",
        label: "Demo Progress",
        percent: 42
      }
    ]
  };
  writeFileSafe(path.resolve(process.cwd(), 'motion.config.json'), JSON.stringify(sample, null, 2));
}

// ---- Generators -------------------------------------------------------------

function escapeXML(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Typewriter SVG
 */
function genTypewriterSVG(o) {
  const width = o.width ?? 600;
  const height = o.height ?? 60;
  const fontFamily = escapeXML(o.fontFamily ?? 'Inter, Segoe UI, Roboto, Arial');
  const fontSize = o.fontSize ?? 26;
  const textColor = o.textColor ?? '#E6EDF3';
  const cursorColor = o.cursorColor ?? '#00E5FF';
  const bg = o.bg ?? 'transparent';
  const lines = Array.isArray(o.lines) && o.lines.length ? o.lines : ['readme-motion'];
  const speedMs = Math.max(10, o.speedMs ?? 60);
  const pauseMs = Math.max(200, o.pauseMs ?? 1200);

  // Build SMIL-based sequence for reliability on GitHub’s SVG engine
  // We create one <text> per line and toggle visibility + length via clipPath.
  const textY = Math.floor(height * 0.67);
  const cursorWidth = 2;

  // Compute keyTimes/keySplines for blinking cursor
  const blinkDur = 0.9; // seconds
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <style>
    @font-face { font-family: ${fontFamily}; }
    .tw { font: ${fontSize}px ${fontFamily}; fill: ${textColor}; }
  </style>

  ${lines.map((line, idx) => {
    const chars = [...line];
    // durations
    const typeDur = (chars.length * speedMs) / 1000;
    const totalDur = typeDur + (pauseMs/1000);
    // Start time for this line
    const begin = lines.slice(0, idx).reduce((acc, l, i) => {
      const tdur = (l.length * speedMs)/1000 + (pauseMs/1000);
      return acc + tdur;
    }, 0);

    // Cursor x progression approximated by char count (monospace-ish effect)
    // We'll position text at 16px padding from left.
    const padX = 16;
    const approxCharW = fontSize * 0.6;
    const cursorXs = chars.map((_, i) => padX + approxCharW * i);
    const endX = padX + approxCharW * chars.length;

    // Build <set> visibility toggles and an animated mask (rect width growth)
    return `
    <g>
      <text class="tw" x="${padX}" y="${textY}">${escapeXML(line)}</text>
      <!-- clipping rectangle to reveal characters -->
      <clipPath id="clip-${idx}">
        <rect x="0" y="0" width="0" height="${height}">
          <animate attributeName="width" dur="${typeDur}s" begin="${begin}s" fill="freeze"
                   from="0" to="${endX + 4}" />
        </rect>
      </clipPath>

      <g clip-path="url(#clip-${idx})">
        <rect x="${endX}" y="${textY - fontSize + 4}" width="${cursorWidth}" height="${fontSize + 6}" fill="${cursorColor}">
          <animate attributeName="opacity" values="1;0;1" dur="${blinkDur}s" repeatCount="indefinite" />
          <set attributeName="visibility" to="visible" begin="${begin}s" />
          <set attributeName="visibility" to="hidden" begin="${begin + typeDur + (pauseMs/1000)}s" />
        </rect>
      </g>

      <!-- show line only in its time window -->
      <set attributeName="visibility" to="visible" begin="${begin}s" />
      <set attributeName="visibility" to="hidden" begin="${begin + totalDur}s" />
    </g>`;
  }).join('\n')}

  <!-- loop the whole sequence -->
  <animate id="loop" attributeName="visibility" from="visible" to="visible"
           begin="0s;loop.end" dur="${lines.reduce((sum, l)=>sum + (l.length * speedMs)/1000 + (pauseMs/1000),0)}s" />
</svg>`;
  return svg;
}

/**
 * Progress bar SVG
 */
function genProgressSVG(o) {
  const width = o.width ?? 600;
  const height = o.height ?? 60;
  const bg = o.bg ?? '#0d1117';
  const trackColor = o.trackColor ?? '#1f2937';
  const barColor = o.barColor ?? '#00E5FF';
  const label = o.label ?? 'Progress';
  const percent = Math.max(0, Math.min(100, Number(o.percent ?? 0)));

  const pad = 12;
  const innerW = width - pad*2;
  const innerH = height - pad*2 - 18; // leave room for label

  const barW = innerW * (percent/100);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="${pad}" y="${pad + 14}" font-family="Inter, Segoe UI, Roboto, Arial" font-size="14" fill="#E6EDF3">${escapeXML(label)} — ${percent}%</text>
  <rect x="${pad}" y="${pad + 18}" rx="6" ry="6" width="${innerW}" height="${innerH}" fill="${trackColor}"/>
  <rect x="${pad}" y="${pad + 18}" rx="6" ry="6" width="0" height="${innerH}" fill="${barColor}">
    <animate attributeName="width" from="0" to="${barW}" dur="1.2s" fill="freeze"/>
  </rect>
</svg>`;
}

// ---- Main -------------------------------------------------------------------

function showHelp() {
  console.log(`
readme-motion
  --init                    Scaffold a sample motion.config.json
  --config <file>          Render SVGs defined in the given config
  -h, --help               Show help
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
    if (item.type === 'typewriter') {
      svg = genTypewriterSVG(item);
    } else if (item.type === 'progress') {
      svg = genProgressSVG(item);
    } else {
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

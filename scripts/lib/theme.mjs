// Shared palette, typography and math helpers for the DZ-KRI flight-ops renderers.
// Every renderer imports this file; keep it free of scene-specific geometry.

export const FONT = "ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace";

// GitHub's own contribution palette, per color scheme, for instant recognition.
export const themes = {
  dark: {
    key: 'dark',
    opsLabel: 'NIGHT OPS',
    skyTop: '#04070d',
    skyBottom: '#0b1424',
    asphalt: '#0e131c',
    asphaltEdge: '#232d40',
    tarmac: '#0a0f18',
    roadLine: '#3d4a5f',
    cellEmpty: '#141a26',
    cellLevels: ['#0e4429', '#006d32', '#26a641', '#39d353'],
    text: '#9aa7b8',
    textBright: '#e6edf3',
    textDim: '#5c6a7d',
    accent: '#6fd2ff',
    accentDim: '#2b7ea3',
    accent2: '#ffb86c',
    glass: '#9fd8ff',
    strobeRed: '#ff4d5e',
    strobeBlue: '#4da3ff',
    star: '#b8c4d6',
    moon: '#d7dee9',
    amber: '#ffc857',
    green: '#39d353',
    edgeLight: '#ffd166',
    paint: 'rgba(255,255,255,0.55)',
    hairline: '#1c2536',
  },
  light: {
    key: 'light',
    opsLabel: 'DAWN OPS',
    skyTop: '#9dc0e6',
    skyBottom: '#eef3fa',
    asphalt: '#12161f',
    asphaltEdge: '#2a3242',
    tarmac: '#1a1f2a',
    roadLine: '#4a5568',
    cellEmpty: '#e9edf3',
    cellLevels: ['#9be9a8', '#40c463', '#30a14c', '#216e39'],
    text: '#57606a',
    textBright: '#1f2328',
    textDim: '#8b949e',
    accent: '#0a6fb0',
    accentDim: '#7aa9c9',
    accent2: '#b35c00',
    glass: '#20364a',
    strobeRed: '#ff4d5e',
    strobeBlue: '#4da3ff',
    star: '#ffffff',
    moon: '#ffe9b8',
    amber: '#b8860b',
    green: '#1a7f37',
    edgeLight: '#f0b429',
    paint: 'rgba(255,255,255,0.65)',
    hairline: '#d0d7de',
  },
};

/** Escape text for safe embedding in SVG markup. */
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Deterministic PRNG (mulberry32) so stars and blips never shuffle between runs. */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit string hash, for seeding per-name randomness. */
export function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Pad a label with middot leaders so several lines align on a column. */
export function dotted(label, width) {
  const dots = Math.max(2, width - label.length);
  return label + ' ' + '·'.repeat(dots) + ' ';
}

/** Short month label, e.g. 2025-11-02 -> NOV. */
export function monthLabel(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
}

/** iso date -> 2025-11-02 style stays as-is; returns "02 NOV 25" for HUD use. */
export function dayStamp(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${String(d.getUTCDate()).padStart(2, '0')} ${months[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

/** Language colors (GitHub linguist). Fallback gray for unknown languages. */
export const LANG_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  PHP: '#4F5D95',
  Kotlin: '#A97BFF',
  Java: '#b07219',
  'Go': '#00ADD8',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Blade: '#f7523f',
  Shell: '#89e051',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Dart: '#00B4AB',
  Swift: '#F05138',
  Rust: '#dea584',
  Vue: '#41b883',
  'Jupyter Notebook': '#DA5B0B',
  SQL: '#e38c00',
  Dockerfile: '#384d54',
  HCL: '#844FBA',
};

export function langColor(name) {
  return LANG_COLORS[name] || '#8b949e';
}

/** Livery palette assigned to flyby squadron members. */
export const SQUADRON_COLORS = ['#6fd2ff', '#ffb86c', '#7ee787', '#ff7b72', '#d2a8ff', '#f8e3a1'];

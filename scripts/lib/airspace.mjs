// THE STRIP — the hero scene of the DZ-KRI profile.
//
// The contribution graph is the runway: 53 weeks of light segments, one per
// day, lit when you committed. A fighter jet flies the pattern above it —
// its livery striped in your top languages, its contrail length set by the
// last week of activity, its afterburner lit while you're on a streak
// (the git-koi idea: the day that just ended decides how it flies).
// A GT3-style patrol car works the tarmac below, headlights on, strobes
// going; its pace follows the last six months of activity. A control tower,
// a windsock, runway edge lights and a distant crossing plane finish the
// field. Everything below is data-driven from data/snapshot.json.

import { esc, themes, FONT, rng, clamp, monthLabel, dayStamp } from './theme.mjs';

const W = 1000;
const H = 420;

const COLS = 53;
const ROWS = 7;
const PITCH = 15; // cell pitch (11px cell + 4px gap)
const CELL = 11;
const GX = 102; // grid left
const GY = 168; // grid top

const ASPH_X = GX - 18;
const ASPH_Y = GY - 14;
const ASPH_W = COLS * PITCH - (PITCH - CELL) + 36;
const ASPH_H = ROWS * PITCH - (PITCH - CELL) + 28;

const ROAD_Y = 288; // tarmac begins right under the runway
const CAR_BASE = 338; // car wheel baseline
const JET_Y = 112; // jet flight path

const CALLSIGN = 'TH3KR1M0';

export function renderAirspace(snapshot, themeKey) {
  const t = themes[themeKey];
  const dark = themeKey === 'dark';
  const { days } = snapshot.contributions;
  const total = snapshot.contributions.total;
  const repos = snapshot.profile.publicRepos;
  const stars = snapshot.profile.totalStars;
  const streak = snapshot.streak;
  const last7 = sumWindow(days, 7);
  const last30 = sumWindow(days, 30);
  const last180 = sumWindow(days, 180);

  const jetDur = clamp(16 - last30 / 4, 8, 16);
  const jetScale = 0.8 + 0.4 * clamp(total / 500, 0, 1);
  const trailLen = 46 + Math.min(last7, 12) * 9;
  const afterburner = streak.current > 0;

  const carActive = last180 > 0;
  const carDur = clamp(24 - last180 / 8, 9, 24);
  const wheelDur = (carDur / 28).toFixed(2);

  return svgHeader(t) + `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.skyTop}"/>
      <stop offset="1" stop-color="${t.skyBottom}"/>
    </linearGradient>
    <linearGradient id="trail" gradientUnits="userSpaceOnUse" x1="${-50}" y1="0" x2="${-50 - trailLen}" y2="0">
      <stop offset="0" stop-color="${dark ? '#cfe6ff' : '#ffffff'}" stop-opacity="0.8"/>
      <stop offset="1" stop-color="${dark ? '#cfe6ff' : '#ffffff'}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="cone" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="158" y2="0">
      <stop offset="0" stop-color="#fff3c4" stop-opacity="${dark ? 0.55 : 0.32}"/>
      <stop offset="1" stop-color="#fff3c4" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
  </defs>

  <!-- sky -->
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${dark ? starsLayer() : ''}
  ${dark ? `
  <!-- moon -->
  <circle cx="908" cy="92" r="15" fill="${t.moon}"/>
  <circle cx="902" cy="87" r="12.5" fill="${t.skyTop}"/>
  ` : ''}

  <!-- distant traffic, crossing the other way -->
  <g>
    <g>
      <animateTransform attributeName="transform" type="translate" from="1180 98" to="-80 98" dur="30s" repeatCount="indefinite"/>
      <path d="M-7,0 L7,0 L4,-3 L-4,-3 Z" fill="${dark ? '#89a0bb' : '#7d8ea1'}"/>
      <circle cx="0" cy="-4" r="1.3" fill="#ffffff">
        <animate attributeName="opacity" values="1;0.1;1" dur="1.1s" repeatCount="indefinite"/>
      </circle>
    </g>
  </g>

  <!-- HUD -->
  <text x="40" y="36" font-family="${FONT}" font-size="16" font-weight="bold" letter-spacing="3" fill="${t.accent}">DZ-KRI // FLIGHT OPS</text>
  <text x="960" y="36" text-anchor="end" font-family="${FONT}" font-size="11" letter-spacing="2" fill="${t.textDim}">RWY 09L · ${t.opsLabel} · SQUAWK 00${String(repos).padStart(2, '0')}</text>
  <text x="40" y="58" font-family="${FONT}" font-size="11" letter-spacing="1" fill="${t.text}">CALLSIGN ${CALLSIGN} — ${esc(snapshot.profile.name).toUpperCase()} · ${stars} STARS ON THE FENCE</text>
  <text x="960" y="58" text-anchor="end" font-family="${FONT}" font-size="11" letter-spacing="1" fill="${t.text}">SORTIES ${total}/12MO · BEST STREAK ${streak.longest}D · HANGARS ${repos}</text>
  <line x1="40" y1="70" x2="960" y2="70" stroke="${t.hairline}" stroke-width="1"/>

  <!-- control tower -->
  <g>
    <line x1="61" y1="82" x2="61" y2="64" stroke="${t.asphaltEdge}" stroke-width="1.6"/>
    <circle cx="61" cy="61" r="3" fill="${t.strobeRed}">
      <animate attributeName="opacity" values="1;0.15;1" dur="2.2s" repeatCount="indefinite"/>
    </circle>
    <rect x="52" y="96" width="18" height="192" fill="${t.asphalt}" stroke="${t.asphaltEdge}" stroke-width="1"/>
    <path d="M42,96 L78,96 L73,82 L47,82 Z" fill="${t.asphaltEdge}"/>
    <rect x="50" y="86" width="8" height="5" fill="${t.amber}" opacity="${dark ? 0.9 : 0.25}"/>
    <rect x="60" y="86" width="8" height="5" fill="${t.amber}" opacity="${dark ? 0.7 : 0.2}"/>
    <rect x="70" y="86" width="6" height="5" fill="${t.amber}" opacity="${dark ? 0.5 : 0.15}"/>
    <g transform="translate(46,78)">
      <circle cx="0" cy="0" r="5" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.8"/>
      <line x1="0" y1="0" x2="0" y2="-4.5" stroke="${t.accent}" stroke-width="1.4">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/>
      </line>
    </g>
  </g>

  <!-- runway asphalt with the contribution grid on it -->
  <rect x="${ASPH_X}" y="${ASPH_Y}" width="${ASPH_W}" height="${ASPH_H}" rx="10" fill="${t.asphalt}" stroke="${t.asphaltEdge}" stroke-width="1"/>
  <text x="88" y="281" font-family="${FONT}" font-size="11" font-weight="bold" letter-spacing="1.5" fill="${t.paint}">09L</text>
  <text x="893" y="281" font-family="${FONT}" font-size="11" font-weight="bold" letter-spacing="1.5" fill="${t.paint}">27R</text>

  ${monthLabels(days, t)}
  ${edgeLights(t)}
  ${runwayCells(days, t, dark)}

  <!-- in-strip caption + level legend -->
  <text x="100" y="281" font-family="${FONT}" font-size="9" letter-spacing="1" fill="${t.textDim}">53 WEEKS · EVERY LIT CELL IS A SORTIE</text>
  <g>
    <text x="745" y="281" text-anchor="end" font-family="${FONT}" font-size="9" fill="${t.textDim}">LESS</text>
    ${t.cellLevels.concat([]).map((c, i) => `<rect x="${754 + i * 12.5}" y="273.5" width="9" height="9" rx="1.5" fill="${c}"/>`).join('')}
    <rect x="${754 + 4 * 12.5}" y="273.5" width="9" height="9" rx="1.5" fill="${t.cellEmpty}" stroke="${t.hairline}"/>
    <text x="${754 + 5 * 12.5 + 6}" y="281" font-family="${FONT}" font-size="9" fill="${t.textDim}">MORE</text>
  </g>

  <!-- jet flying the pattern -->
  <g transform="translate(0,${JET_Y})">
    <g>
      <animateTransform attributeName="transform" type="translate" from="-160 0" to="1160 0" dur="${jetDur}s" repeatCount="indefinite"/>
      <g transform="scale(${jetScale.toFixed(3)})">
        <rect x="${-50 - trailLen}" y="-2.6" width="${trailLen}" height="1.5" fill="url(#trail)"/>
        <rect x="${-50 - trailLen}" y="1.1" width="${trailLen}" height="1.5" fill="url(#trail)"/>
        ${afterburner ? `
        <circle cx="-49" cy="0" r="5" fill="#ff9f43">
          <animate attributeName="opacity" values="0.75;0.3;0.75" dur="0.4s" repeatCount="indefinite"/>
        </circle>` : ''}
        <path d="M8,1 L-24,10 L-16,11.5 L16,4 Z" fill="${dark ? '#26354d' : '#33415c'}"/>
        <path d="M46,0 L28,-4.5 L-20,-5.5 L-44,-3 L-44,3 L-20,6 L28,4.5 Z" fill="${dark ? '#3d4f6b' : '#51637f'}" stroke="${dark ? '#0a0e14' : '#1c2536'}" stroke-width="0.6"/>
        <path d="M-30,-5 L-37,-16 L-45,-16 L-43,-3 Z" fill="${dark ? '#31415c' : '#42536f'}"/>
        <path d="M-27,1 L-50,10 L-45,12 L-26,6 Z" fill="${dark ? '#26354d' : '#33415c'}"/>
        <path d="M31,-4.5 Q24,-10 13,-7.5 L18,-4.5 Z" fill="${t.glass}"/>
        ${liveryStripes(snapshot.languages)}
        <rect x="-46.5" y="-2" width="4" height="4" rx="1.4" fill="#0a0e14" stroke="${t.accent}" stroke-width="0.7"/>
        <circle cx="-44" cy="-16" r="2" fill="#ffffff">
          <animate attributeName="opacity" values="1;0;0;1" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      </g>
    </g>
  </g>

  <!-- tarmac -->
  <rect x="0" y="${ROAD_Y}" width="${W}" height="${H - ROAD_Y}" fill="${t.tarmac}"/>
  <line x1="0" y1="${ROAD_Y}" x2="${W}" y2="${ROAD_Y}" stroke="${t.paint}" stroke-width="2" opacity="0.5"/>
  <text x="500" y="392" text-anchor="middle" font-family="${FONT}" font-size="36" font-weight="bold" letter-spacing="14" fill="${t.paint}" opacity="0.07">DZ·KRI</text>

  <!-- patrol car -->
  ${carActive ? `
  <g>
    <animateTransform attributeName="transform" type="translate" from="-170 ${CAR_BASE}" to="1170 ${CAR_BASE}" dur="${carDur}s" repeatCount="indefinite"/>
    ${patrolCar(t, wheelDur, dark)}
  </g>` : `
  <g transform="translate(430,${CAR_BASE})">
    ${patrolCar(t, wheelDur, dark)}
  </g>`}

  <!-- lane dashes + windsock -->
  <line x1="0" y1="352" x2="${W}" y2="352" stroke="${t.roadLine}" stroke-width="2" stroke-dasharray="26 22">
    <animate attributeName="stroke-dashoffset" from="0" to="48" dur="${carActive ? carDur / 8 : 6}s" repeatCount="indefinite"/>
  </line>
  <g transform="translate(948,352)">
    <line x1="0" y1="0" x2="0" y2="-22" stroke="${t.asphaltEdge}" stroke-width="2"/>
    <g transform="translate(0,-22)">
      <path d="M0,-1 L-26,2 L0,6 Z" fill="${t.accent2}">
        <animateTransform attributeName="transform" type="rotate" values="-7 0 2;9 0 2;-7 0 2" dur="3.2s" repeatCount="indefinite"/>
      </path>
    </g>
  </g>

  <!-- footer -->
  <text x="84" y="${H - 12}" font-family="${FONT}" font-size="9" letter-spacing="1" fill="${t.textDim}">EVERY LIGHT IS A SORTIE — REDRAWN NIGHTLY FROM LIVE GITHUB DATA</text>
  <text x="916" y="${H - 12}" text-anchor="end" font-family="${FONT}" font-size="9" letter-spacing="1" fill="${t.textDim}">SRC GITHUB API · NO SERVERS · LAST SORTIE ${streak.lastActive ? dayStamp(streak.lastActive) : '—'}</text>
</svg>`;
}

function svgHeader(t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<title>DZ-KRI Flight Ops: the contribution runway</title>
<desc>The year of contributions drawn as a night runway. A jet with livery in the pilot's top languages flies the pattern; a patrol car works the tarmac.</desc>`;
}

/** Sum of contributions over the trailing n days of the snapshot. */
function sumWindow(days, n) {
  return days.slice(-n).reduce((a, d) => a + d.count, 0);
}

/** Deterministic starfield for the dark theme. */
function starsLayer() {
  const rand = rng(20260101);
  let out = '';
  for (let i = 0; i < 46; i++) {
    const x = (rand() * 1000).toFixed(1);
    const y = (5 + rand() * 128).toFixed(1);
    const r = (0.5 + rand() * 0.9).toFixed(2);
    const base = (0.25 + rand() * 0.5).toFixed(2);
    if (i % 4 === 0) {
      out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#b8c4d6"><animate attributeName="opacity" values="${base};1;${base}" dur="${(2 + rand() * 3).toFixed(1)}s" begin="${(rand() * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    } else {
      out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#b8c4d6" opacity="${base}"/>`;
    }
  }
  return out;
}

/** The 53x7 contribution grid, drawn as lit runway segments. */
function runwayCells(days, t, dark) {
  const out = [];
  for (const day of days) {
    const x = GX + day.col * PITCH;
    const y = GY + day.row * PITCH;
    if (day.level === 0) {
      out.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${t.cellEmpty}"/>`);
    } else {
      const fill = t.cellLevels[Math.min(day.level, 4) - 1];
      if (day.level >= 3) {
        out.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}" filter="url(#glow)" opacity="0.45"/>`);
      }
      out.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"/>`);
    }
  }
  return out.join('\n  ');
}

/** Month initials along the top padding of the asphalt, GitHub-style. */
function monthLabels(days, t) {
  const perCol = new Map();
  for (const day of days) {
    const m = day.date.slice(0, 7);
    if (!perCol.has(day.col)) perCol.set(day.col, new Set());
    perCol.get(day.col).add(m);
  }
  const out = [];
  let lastCol = -10;
  let seen = new Set();
  const cols = [...perCol.keys()].sort((a, b) => a - b);
  for (const col of cols) {
    for (const m of perCol.get(col)) {
      if (seen.has(m)) continue;
      seen.add(m);
      if (col - lastCol >= 2 && col > 0) {
        out.push(`<text x="${GX + col * PITCH}" y="${GY - 3}" font-family="${FONT}" font-size="9" letter-spacing="1" fill="${t.textDim}">${monthLabel(m + '-01')}</text>`);
        lastCol = col;
      }
    }
  }
  return out.join('\n  ');
}

/** Runway edge lights along the asphalt, twinkling. */
function edgeLights(t) {
  let out = '';
  for (let i = 0; i <= 20; i++) {
    const x = (92 + i * ((908 - 92) / 20)).toFixed(1);
    out += `<circle cx="${x}" cy="${ASPH_Y - 4}" r="1.6" fill="${t.edgeLight}"><animate attributeName="opacity" values="0.35;1;0.35" dur="2.5s" begin="${(i * 0.13).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    out += `<circle cx="${x}" cy="${ASPH_Y + ASPH_H + 4}" r="1.6" fill="${t.edgeLight}"><animate attributeName="opacity" values="1;0.35;1" dur="2.5s" begin="${(i * 0.13 + 1).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
  }
  return out;
}

/** Livery stripes on the jet: top three languages. */
function liveryStripes(languages) {
  const top = languages.slice(0, 3);
  if (top.length === 0) return '';
  const positions = [-20, -8, 4];
  return top
    .map((lang, i) => `<rect x="${positions[i]}" y="-1.2" width="9" height="2.6" fill="${lang.color}"/>`)
    .join('');
}

/** The GT3-style patrol car, headlights and strobes, wheels turning. */
function patrolCar(t, wheelDur, dark) {
  const glass = dark ? '#9fd8ff' : '#20364a';
  const body = dark ? '#c9d4e4' : '#e8edf4';
  const bodyDark = dark ? '#93a3ba' : '#b7c2d0';
  return `
    <ellipse cx="0" cy="0.5" rx="58" ry="3" fill="#000000" opacity="0.35"/>
    <polygon points="60,-10.5 158,-18 158,-3 60,-4" fill="url(#cone)"/>
    <path d="M-59,-2 L-59,-9 L-51,-12 L-33,-14 L-26,-18 Q-21,-25 -13,-25 L7,-25 Q13,-25 17,-22 L26,-14 L44,-13 L60,-10 L60,-4 Z" fill="${body}" stroke="${bodyDark}" stroke-width="0.8"/>
    <path d="M-51,-12 L-58,-21 L-62,-21 L-58,-10 Z" fill="${body}"/>
    <path d="M-10,-22 L6,-22 L13,-16 L-19,-16 Z" fill="${glass}"/>
    <rect x="56" y="-9.5" width="3.5" height="2.6" rx="1" fill="#fff3c4"/>
    <rect x="-60" y="-9.5" width="2.6" height="2.6" rx="1" fill="#ff3b30"/>
    <circle cx="-59" cy="-8" r="4" fill="#ff3b30" opacity="0.35"/>
    <rect x="-8" y="-27.5" width="7" height="2.2" rx="1" fill="${t.strobeRed}">
      <animate attributeName="opacity" values="1;0.1;1" dur="0.8s" repeatCount="indefinite"/>
    </rect>
    <rect x="1" y="-27.5" width="7" height="2.2" rx="1" fill="${t.strobeBlue}">
      <animate attributeName="opacity" values="0.1;1;0.1" dur="0.8s" repeatCount="indefinite"/>
    </rect>
    ${wheel(-38, wheelDur)}${wheel(38, wheelDur)}`;
}

function wheel(cx, wheelDur) {
  const c = cy => `${cx} ${cy}`;
  return `
    <circle cx="${cx}" cy="-7.5" r="7.5" fill="#0a0d12" stroke="#2b3442" stroke-width="1.2"/>
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 ${c(-7.5)}" to="360 ${c(-7.5)}" dur="${wheelDur}s" repeatCount="indefinite"/>
      <circle cx="${cx}" cy="-7.5" r="4" fill="#8b98a8"/>
      <line x1="${cx - 4}" y1="-7.5" x2="${cx + 4}" y2="-7.5" stroke="#0a0d12" stroke-width="1"/>
      <line x1="${cx - 2}" y1="-11" x2="${cx + 2}" y2="-4" stroke="#0a0d12" stroke-width="1"/>
      <line x1="${cx - 2}" y1="-4" x2="${cx + 2}" y2="-11" stroke="#0a0d12" stroke-width="1"/>
    </g>`;
}

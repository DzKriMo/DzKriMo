// ARIA DECK LOG - the AI panel of the DZ-KRI profile.
//
// The onboard AI boots and types a recon report about the pilot, built from
// the snapshot: identity, hangars, sorties, streak, emissions (languages)
// and one finding. Lines type in one by one through animated clip paths;
// the cursor never stops blinking. The terminal stays dark in both themes -
// terminals do.

import { themes, FONT, dotted } from './theme.mjs';

const W = 1000;
const H = 316;
const LINE_Y0 = 78;
const LINE_STEP = 24;
const TEXT_X = 48;
const CHAR_PX = 7.9; // 13px monospace advance
const CPS = 46; // typing speed, chars per second

const C = {
  prompt: '#3fb950',
  ok: '#3fb950',
  sys: '#8b949e',
  data: '#e6edf3',
  warn: '#d29922',
  ai: '#58a6ff',
};

export function renderDecklog(snapshot) {
  const t = themes.dark;
  const p = snapshot.profile;
  const c = snapshot.contributions;
  const streak = snapshot.streak;
  const langs = snapshot.languages.slice(0, 5).map((l) => l.name).join(' · ');

  const lines = [
    { segs: [['aria@dz-kri:~$ ', C.prompt], ['recon --target DzKriMo --depth full', C.data]] },
    { segs: [['[boot] ', C.sys], ['ARIA v2.3 · reasoning engine online · sensors nominal', C.sys]] },
    { segs: [['[ ok ] ', C.ok], [dotted('identity', 16) + 'Akram Mehdi Amamra · CS Engineer · security + AI', C.data]] },
    { segs: [['[ ok ] ', C.ok], [dotted('hangars', 16) + `${p.publicRepos} public repos · ${p.totalStars} stars on the fence`, C.data]] },
    { segs: [['[ ok ] ', C.ok], [dotted('sorties', 16) + `${c.total} contributions in the last 12 months`, C.data]] },
    { segs: [['[ ok ] ', C.ok], [dotted('streak', 16) + `${streak.current} days hot · record ${streak.longest} days`, C.data]] },
    { segs: [['[ ok ] ', C.ok], [dotted('emissions', 16) + langs, C.data]] },
    { segs: [['[ !! ] ', C.warn], [dotted('finding', 16) + 'activity comes in bursts · probably deadlines', C.warn]] },
    { segs: [['aria@dz-kri:~$ ', C.prompt], ['status → AIRBORNE · cleared to build', C.ai]] },
  ];

  // Typing schedule: each line types out, then a short beat before the next.
  let cursor = 0.25;
  const timed = lines.map((line) => {
    const chars = line.segs.reduce((a, s) => a + s[0].length, 0);
    const begin = cursor;
    const dur = Math.max(0.35, chars / CPS);
    cursor += dur + 0.22;
    return { line, begin, dur, chars };
  });
  const cursorX = TEXT_X + timed[timed.length - 1].chars * CHAR_PX + 6;
  const cursorY = LINE_Y0 + (lines.length - 1) * LINE_STEP - 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<title>ARIA deck log: the onboard AI reports on the pilot</title>
<desc>A terminal window where the onboard AI types a recon report with live GitHub stats.</desc>
<defs>
  <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0d1117" stop-opacity="0.13"/>
    <stop offset="0.5" stop-color="#0d1117" stop-opacity="0"/>
    <stop offset="1" stop-color="#0d1117" stop-opacity="0.13"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${themes.light.skyBottom}"/>
<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="12" fill="#0d1117" stroke="#30363d" stroke-width="1"/>

  <!-- title bar -->
  <circle cx="44" cy="38" r="5" fill="#ff5f56"/>
  <circle cx="62" cy="38" r="5" fill="#ffbd2e"/>
  <circle cx="80" cy="38" r="5" fill="#27c93f"/>
  <text x="500" y="42" text-anchor="middle" font-family="${FONT}" font-size="11" letter-spacing="1" fill="${C.sys}">aria@dz-kri: flight deck log</text>
  <text x="956" y="42" text-anchor="end" font-family="${FONT}" font-size="11" fill="${C.sys}">v2.3</text>
  <line x1="20" y1="54" x2="980" y2="54" stroke="#21262d" stroke-width="1"/>

  ${timed.map((entry, i) => typedLine(entry, i)).join('\n  ')}

  <!-- blinking cursor -->
  <rect x="${cursorX.toFixed(1)}" y="${cursorY}" width="8" height="15" fill="${C.ai}">
    <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
  </rect>

  <!-- scanline shimmer -->
  <rect x="20" y="55" width="${W - 40}" height="${H - 95}" fill="url(#scan)">
    <animate attributeName="y" values="55;${H - 40};55" dur="9s" repeatCount="indefinite"/>
  </rect>
</svg>`;
}

/** One line of the log, revealed by an animated clip path (a typing effect). */
function typedLine({ line, begin, dur, chars }, i) {
  const y = LINE_Y0 + i * LINE_STEP;
  const width = chars * CHAR_PX + 8;
  const tspans = line.segs
    .map(([text, fill]) => `<tspan fill="${fill}">${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</tspan>`)
    .join('');
  return `<clipPath id="type${i}">
    <rect x="${TEXT_X - 4}" y="${y - 14}" width="0" height="18">
      <animate attributeName="width" from="0" to="${width.toFixed(1)}" begin="${begin.toFixed(2)}s" dur="${dur.toFixed(2)}s" fill="freeze" calcMode="spline" keySplines="0.3 0 0.8 1" keyTimes="0;1"/>
    </rect>
  </clipPath>
  <text x="${TEXT_X}" y="${y}" font-family="${FONT}" font-size="13" clip-path="url(#type${i})">${tspans}</text>`;
}

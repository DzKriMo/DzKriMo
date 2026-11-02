// SIGINT SCOPE — the cybersecurity panel of the DZ-KRI profile.
//
// A passive radar: the sweep turns forever, and the repos are contacts —
// blips placed deterministically (hash of the repo name), sized by stars,
// colored by language. The contact list on the right is the scope's
// intercept log, and the emission signature is the language mix bar.

import { esc, themes, FONT, hash, rng } from './theme.mjs';

const W = 1000;
const H = 340;
const CX = 160;
const CY = 178;
const R = 118;

export function renderRadar(snapshot, themeKey) {
  const t = themes[themeKey];
  const repos = snapshot.repos.slice(0, 8);
  const langTotal = snapshot.languages.reduce((a, l) => a + l.count, 0) || 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<title>SIGINT scope: repos as radar contacts</title>
<desc>Passive radar sweep with the top repositories as blips, colored by language, plus a contact list and the language emission signature.</desc>
<rect width="${W}" height="${H}" fill="${t.skyBottom}"/>

  <text x="40" y="34" font-family="${FONT}" font-size="15" font-weight="bold" letter-spacing="3" fill="${t.accent}">SIGINT // SCOPE</text>
  <text x="960" y="34" text-anchor="end" font-family="${FONT}" font-size="11" letter-spacing="1" fill="${t.text}">${snapshot.profile.publicRepos} HANGARS INDEXED · ${snapshot.profile.totalStars} STARS TRACKED · MODE: PASSIVE</text>
  <line x1="40" y1="46" x2="960" y2="46" stroke="${t.hairline}" stroke-width="1"/>

  <!-- scope -->
  <g>
    ${ring(R, t)}${ring(R * 0.66, t)}${ring(R * 0.33, t)}
    <line x1="${CX - R}" y1="${CY}" x2="${CX + R}" y2="${CY}" stroke="${t.accent}" stroke-width="1" opacity="0.25"/>
    <line x1="${CX}" y1="${CY - R}" x2="${CX}" y2="${CY + R}" stroke="${t.accent}" stroke-width="1" opacity="0.25"/>
    ${ticks(t)}
    <text x="${CX}" y="${CY - R - 6}" text-anchor="middle" font-family="${FONT}" font-size="9" fill="${t.textDim}">000</text>
    <text x="${CX + R + 8}" y="${CY + 3}" font-family="${FONT}" font-size="9" fill="${t.textDim}">090</text>
    <text x="${CX}" y="${CY + R + 14}" text-anchor="middle" font-family="${FONT}" font-size="9" fill="${t.textDim}">180</text>
    <text x="${CX - R - 8}" y="${CY + 3}" text-anchor="end" font-family="${FONT}" font-size="9" fill="${t.textDim}">270</text>

    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 ${CX} ${CY}" to="360 ${CX} ${CY}" dur="4.5s" repeatCount="indefinite"/>
      ${wedge(-90, -66, 0.14, t)}
      ${wedge(-66, -46, 0.06, t)}
      <line x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - R}" stroke="${t.accent}" stroke-width="2" opacity="0.9"/>
    </g>
    <circle cx="${CX}" cy="${CY}" r="3" fill="${t.accent}"/>
    ${repos.map((repo, i) => blip(repo, i, t)).join('\n    ')}
  </g>

  <!-- contact list -->
  <text x="330" y="76" font-family="${FONT}" font-size="12" font-weight="bold" letter-spacing="2" fill="${t.textBright}">CONTACT LIST</text>
  ${repos.map((repo, i) => contactRow(repo, i, t)).join('\n  ')}

  <!-- emission signature: language mix bar -->
  <text x="330" y="${272}" font-family="${FONT}" font-size="12" font-weight="bold" letter-spacing="2" fill="${t.textBright}">EMISSION SIGNATURE</text>
  <g>
    ${langBar(snapshot.languages, langTotal)}
  </g>
  <g>
    ${snapshot.languages.slice(0, 8).map((lang, i) => langLegend(lang, i, t, langTotal)).join('\n    ')}
  </g>
</svg>`;
}

function ring(r, t) {
  return `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.45"/>`;
}

function ticks(t) {
  let out = '';
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    const x1 = CX + Math.cos(rad) * (R - 4);
    const y1 = CY + Math.sin(rad) * (R - 4);
    const x2 = CX + Math.cos(rad) * R;
    const y2 = CY + Math.sin(rad) * R;
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${t.accent}" stroke-width="1.2" opacity="0.5"/>`;
  }
  return out;
}

/** Solid sweep trail wedges (angle start/end in degrees). */
function wedge(a0, a1, opacity, t) {
  const p = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return `${(CX + Math.cos(rad) * R).toFixed(1)} ${(CY + Math.sin(rad) * R).toFixed(1)}`;
  };
  return `<path d="M${CX},${CY} L${p(a0)} A${R} ${R} 0 0 1 ${p(a1)} Z" fill="${t.accent}" opacity="${opacity}"/>`;
}

/** One repo as a pulsing blip with a callsign label. */
function blip(repo, i, t) {
  const rand = rng(hash(repo.name));
  const angle = rand() * Math.PI * 2;
  const radius = 34 + rand() * (R - 52);
  const x = CX + Math.cos(angle) * radius;
  const y = CY + Math.sin(angle) * radius;
  const r = 3 + Math.min(repo.stars, 5) * 0.7;
  const labelX = x + 9;
  const labelY = y + 3;
  const name = repo.name.length > 16 ? repo.name.slice(0, 15) + '…' : repo.name;
  return `<g>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${repo.languageColor}">
        <animate attributeName="opacity" values="0.45;1;0.45" dur="2.4s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite"/>
      </circle>
      <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" font-family="${FONT}" font-size="9.5" fill="${t.textBright}" opacity="0.9">${esc(name)}</text>
    </g>`;
}

function contactRow(repo, i, t) {
  const y = 100 + i * 21;
  const pushed = String(repo.pushedAt || '').slice(0, 10);
  return `<g>
    <rect x="330" y="${y - 9}" width="9" height="9" rx="1.5" fill="${repo.languageColor}"/>
    <text x="347" y="${y}" font-family="${FONT}" font-size="11" fill="${t.textBright}">${esc(repo.name)}</text>
    <text x="640" y="${y}" font-family="${FONT}" font-size="10" fill="${t.textDim}">${esc(repo.language || '—')}</text>
    <text x="742" y="${y}" font-family="${FONT}" font-size="10" fill="${t.textDim}">★ ${repo.stars}</text>
    <text x="960" y="${y}" text-anchor="end" font-family="${FONT}" font-size="10" fill="${t.textDim}">last push ${pushed}</text>
  </g>`;
}

function langBar(languages, total) {
  let x = 330;
  const y = 286;
  const w = 630;
  const out = [];
  for (const lang of languages) {
    const seg = (lang.count / total) * w;
    out.push(`<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(seg, 2).toFixed(1)}" height="10" fill="${lang.color}"/>`);
    x += seg;
  }
  return out.join('');
}

function langLegend(lang, i, t, total) {
  const x = 330 + (i % 4) * 160;
  const y = 310 + Math.floor(i / 4) * 16;
  const pct = ((lang.count / total) * 100).toFixed(0);
  return `<circle cx="${x}" cy="${y - 4}" r="4" fill="${lang.color}"/>
    <text x="${x + 9}" y="${y}" font-family="${FONT}" font-size="10" fill="${t.text}">${esc(lang.name)} ${pct}%</text>`;
}

// FLIGHT LOG - the visitor wall of the DZ-KRI profile.
//
// Anyone can request a flyby: they open an issue titled "FLYBY: <callsign>",
// the tower (a GitHub Action) clears them, and their callsign gets painted
// on the wall as a jet in their assigned livery color. data/squadron.json
// is the manifest; this renderer paints it.

import { esc, FONT, SQUADRON_COLORS } from './theme.mjs';

const W = 1000;
const PER_ROW = 6;
const CELL_W = (W - 80) / PER_ROW;
const JET_Y = 78; // jet center line in each row
const ROW_H = 96;
const MAX_SHOWN = 18;

export function renderSquadron(squadron) {
  const members = squadron.members ?? [];
  const shown = members.slice(-MAX_SHOWN);
  const extra = members.length - shown.length;
  const rows = Math.max(1, Math.ceil(Math.max(shown.length, 1) / PER_ROW));
  const H = 64 + rows * ROW_H + (extra > 0 ? 26 : 0) + 16;

  const header = `
  <text x="40" y="38" font-family="${FONT}" font-size="15" font-weight="bold" letter-spacing="3" fill="#6fd2ff">FLIGHT LOG // WALL OF FLYBYS</text>
  <text x="960" y="38" text-anchor="end" font-family="${FONT}" font-size="11" letter-spacing="1" fill="#9aa7b8">${members.length} CALLSIGN${members.length === 1 ? '' : 'S'} CLEARED FOR THE STRIP</text>
  <line x1="40" y1="50" x2="960" y2="50" stroke="#1c2536" stroke-width="1"/>`;

  let body = '';
  if (shown.length === 0) {
    body = `
  <rect x="40" y="72" width="920" height="118" rx="12" fill="#0e131c" stroke="#232d40" stroke-width="1" stroke-dasharray="8 6"/>
  <text x="500" y="118" text-anchor="middle" font-family="${FONT}" font-size="13" letter-spacing="2" fill="#9aa7b8">NO FLYBYS LOGGED · PATTERN EMPTY</text>
  <text x="500" y="144" text-anchor="middle" font-family="${FONT}" font-size="12" fill="#5c6a7d">BE THE FIRST: OPEN AN ISSUE TITLED</text>
  <text x="500" y="166" text-anchor="middle" font-family="${FONT}" font-size="12" fill="#ffb86c">FLYBY: YOUR_CALLSIGN</text>`;
  } else {
    body = shown
      .map((member, i) => {
        const col = i % PER_ROW;
        const row = Math.floor(i / PER_ROW);
        const cx = 40 + col * CELL_W + CELL_W / 2;
        const cy = 64 + row * ROW_H + JET_Y;
        const color = member.color || SQUADRON_COLORS[i % SQUADRON_COLORS.length];
        const callsign = member.callsign.length > 14 ? member.callsign.slice(0, 13) + '…' : member.callsign;
        return `<g>
      <g transform="translate(${cx.toFixed(1)},${cy}) scale(0.72)">
        ${miniJet(color)}
      </g>
      <text x="${cx.toFixed(1)}" y="${cy + 26}" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="bold" fill="#e6edf3">${esc(callsign)}</text>
      <text x="${cx.toFixed(1)}" y="${cy + 40}" text-anchor="middle" font-family="${FONT}" font-size="9" fill="#5c6a7d">@${esc(member.login)}</text>
    </g>`;
      })
      .join('\n  ');
    if (extra > 0) {
      const y = 64 + rows * ROW_H + 14;
      body += `\n  <text x="500" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="11" fill="#5c6a7d">+${extra} MORE ON THE MANIFEST</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<title>Flight log: visitors who requested a flyby</title>
<desc>Every visitor who opened a flyby issue gets their callsign painted on the wall as a jet.</desc>
<rect width="${W}" height="${H}" fill="#04070d"/>
${header}
${body}
</svg>`;
}

/** Small jet silhouette in the member's livery color. */
function miniJet(color) {
  return `<g>
    <path d="M46,0 L28,-4.5 L-20,-5.5 L-44,-3 L-44,3 L-20,6 L28,4.5 Z" fill="${color}" opacity="0.92"/>
    <path d="M-30,-5 L-37,-16 L-45,-16 L-43,-3 Z" fill="${color}" opacity="0.75"/>
    <path d="M-27,1 L-50,10 L-45,12 L-26,6 Z" fill="${color}" opacity="0.55"/>
    <path d="M31,-4.5 Q24,-10 13,-7.5 L18,-4.5 Z" fill="#0d1117" opacity="0.55"/>
    <circle cx="-44" cy="-16" r="2" fill="#ffffff">
      <animate attributeName="opacity" values="1;0;0;1" dur="1.2s" repeatCount="indefinite"/>
    </circle>
    <rect x="-45" y="-2.4" width="7" height="1.6" fill="${color}" opacity="0.5">
      <animate attributeName="x" values="-45;-66;-45" dur="2.8s" repeatCount="indefinite"/>
      <animate attributeName="width" values="7;28;7" dur="2.8s" repeatCount="indefinite"/>
    </rect>
  </g>`;
}

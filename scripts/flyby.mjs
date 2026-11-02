// THE TOWER - flyby clearance bot.
//
// Triggered by the Flyby workflow on any issue whose title starts with
// "FLYBY:". Registers the requester's callsign in data/squadron.json
// (one entry per GitHub login; re-requesting updates the callsign and
// keeps the original join date) and writes data/flyby-reply.md for the
// workflow to post as the clearance comment. The issue itself is closed
// by the workflow; this script never touches the network.
//
// Env: ISSUE_TITLE, ISSUE_LOGIN, ISSUE_NUMBER

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { SQUADRON_COLORS } from './lib/theme.mjs';

const SQUADRON_PATH = new URL('../data/squadron.json', import.meta.url);
const REPLY_PATH = new URL('../data/flyby-reply.md', import.meta.url);
const MAX_MEMBERS = 36;

const title = process.env.ISSUE_TITLE ?? '';
const login = process.env.ISSUE_LOGIN ?? 'pilot';
const number = process.env.ISSUE_NUMBER ?? '0';

/** Anything printable and civilized, 24 chars max. */
function sanitizeCallsign(raw) {
  const cleaned = raw
    .replace(/flyby\s*:?/i, '')
    .replace(/[^\p{L}\p{N}_\- ]/gu, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 24);
  return cleaned.length >= 2 ? cleaned.toUpperCase() : null;
}

const callsign = sanitizeCallsign(title) ?? login.toUpperCase().slice(0, 24);

function loadSquadron() {
  if (!existsSync(SQUADRON_PATH)) return { members: [] };
  try {
    const parsed = JSON.parse(readFileSync(SQUADRON_PATH, 'utf8'));
    return { members: Array.isArray(parsed.members) ? parsed.members : [] };
  } catch {
    return { members: [] };
  }
}

const squadron = loadSquadron();
const existing = squadron.members.find((m) => m.login.toLowerCase() === login.toLowerCase());

let heading;
if (existing) {
  const old = existing.callsign;
  existing.callsign = callsign;
  heading = `Callsign updated: **${old}** to **${callsign}**. The wall repaints in about a minute.`;
} else {
  squadron.members.push({
    login,
    callsign,
    color: SQUADRON_COLORS[squadron.members.length % SQUADRON_COLORS.length],
    joinedAt: new Date().toISOString().slice(0, 10),
  });
  if (squadron.members.length > MAX_MEMBERS) {
    squadron.members = squadron.members.slice(-MAX_MEMBERS);
  }
  heading = `Cleared. **${callsign}**, you're jet number ${squadron.members.length} on the wall. Give it a minute to repaint.`;
}

squadron.members.sort((a, b) => String(a.joinedAt).localeCompare(String(b.joinedAt)));
writeFileSync(SQUADRON_PATH, JSON.stringify(squadron, null, 2) + '\n');

const reply = `${heading}

\`\`\`
DZ-KRI TOWER · issue #${number}
→ ${callsign}, runway 09L, wind calm, cleared for the flyby.
→ The wall: https://github.com/DzKriMo/DzKriMo#flight-log
\`\`\`

*Nothing is stored beyond callsign and login, check [data/squadron.json](https://github.com/DzKriMo/DzKriMo/blob/main/data/squadron.json). Closing the issue. See you on the strip.*
`;

writeFileSync(REPLY_PATH, reply);
console.log(`Cleared ${callsign} (@${login}). ${squadron.members.length} members on the wall.`);

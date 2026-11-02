// Render every panel of the DZ-KRI profile from data/snapshot.json and
// data/squadron.json into assets/. Run after scripts/fetch.mjs.
//
//   node scripts/render.mjs
//
// Output files:
//   assets/dark/airspace.svg   assets/light/airspace.svg
//   assets/dark/radar.svg      assets/light/radar.svg
//   assets/decklog.svg         assets/squadron.svg

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { renderAirspace } from './lib/airspace.mjs';
import { renderRadar } from './lib/radar.mjs';
import { renderDecklog } from './lib/decklog.mjs';
import { renderSquadron } from './lib/squadron.mjs';

const ROOT = new URL('..', import.meta.url);
const ASSETS = new URL('assets/', ROOT);

function readJson(path, fallback) {
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  return fallback;
}

const snapshot = readJson(new URL('data/snapshot.json', ROOT), null);
if (!snapshot) {
  console.error('No data/snapshot.json — run: node scripts/fetch.mjs');
  process.exit(1);
}
const squadron = readJson(new URL('data/squadron.json', ROOT), { members: [] });

for (const dir of ['dark', 'light']) mkdirSync(new URL(dir, ASSETS), { recursive: true });

const files = {
  'dark/airspace.svg': renderAirspace(snapshot, 'dark'),
  'light/airspace.svg': renderAirspace(snapshot, 'light'),
  'dark/radar.svg': renderRadar(snapshot, 'dark'),
  'light/radar.svg': renderRadar(snapshot, 'light'),
  'decklog.svg': renderDecklog(snapshot),
  'squadron.svg': renderSquadron(squadron),
};

for (const [name, svg] of Object.entries(files)) {
  const target = new URL(`assets/${name}`, ROOT);
  writeFileSync(target, svg);
  console.log(`wrote assets/${name} (${(svg.length / 1024).toFixed(1)} KiB)`);
}

// Data layer for the DZ-KRI flight-ops pipeline.
//
// Two ways to collect a snapshot, in order of preference:
//   1. GraphQL with a GITHUB_TOKEN (the nightly Action path).
//   2. Public, unauthenticated endpoints: api.github.com REST + the
//      contributions HTML fragment GitHub itself ships to browsers.
//      This is what local development uses.
//
// The output is data/snapshot.json, the single source of truth every
// renderer reads. No npm dependencies: Node's global fetch only.

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { langColor } from './theme.mjs';

const LOGIN = process.env.GH_LOGIN || 'DzKriMo';
const SNAPSHOT_PATH = new URL('../../data/snapshot.json', import.meta.url);

const GRAPHQL_QUERY = `query($login: String!) {
  user(login: $login) {
    login
    name
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        pushedAt
        url
        primaryLanguage { name }
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount }
        }
      }
    }
  }
}`;

/** Convert raw counts into GitHub's five levels (approximation of their quartiles). */
export function levelFor(count) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

/** Build the flat day list with grid coordinates from a weeks structure. */
function daysFromWeeks(weeks) {
  const days = [];
  weeks.forEach((week, col) => {
    week.contributionDays.forEach((day, row) => {
      days.push({
        date: day.date,
        count: day.contributionCount,
        level: levelFor(day.contributionCount),
        col,
        row,
      });
    });
  });
  return days;
}

/** Current + longest streak, measured the same way GitHub's profile does. */
export function computeStreaks(days) {
  let longest = 0;
  let run = 0;
  let longestEnd = null;
  for (const day of days) {
    if (day.count > 0) {
      run += 1;
      if (run > longest) {
        longest = run;
        longestEnd = day.date;
      }
    } else {
      run = 0;
    }
  }
  // Current streak: walk back from the newest day. A zero today doesn't
  // break a streak that is still alive as of yesterday.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current += 1;
    else if (i === days.length - 1) continue;
    else break;
  }
  const lastActive = [...days].reverse().find((d) => d.count > 0)?.date ?? null;
  return { current, longest, longestEnd, lastActive };
}

/** Aggregate primary languages across non-fork repos. */
function aggregateLanguages(repos) {
  const counts = new Map();
  for (const repo of repos) {
    const lang = repo.language;
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, color: langColor(name) }))
    .sort((a, b) => b.count - a.count);
}

async function graphqlSnapshot(token, login) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'dz-kri-flight-ops',
    },
    body: JSON.stringify({ query: GRAPHQL_QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  const user = body.data.user;
  if (!user) throw new Error('user not found');
  const repos = user.repositories.nodes.map((r) => ({
    name: r.name,
    language: r.primaryLanguage?.name ?? null,
    languageColor: r.primaryLanguage ? langColor(r.primaryLanguage.name) : '#8b949e',
    stars: r.stargazerCount,
    pushedAt: r.pushedAt,
    description: r.description,
    url: r.url,
  }));
  const calendar = user.contributionsCollection.contributionCalendar;
  const days = daysFromWeeks(calendar.weeks);
  return finalize(
    {
      profile: {
        name: user.name || user.login,
        followers: user.followers.totalCount,
        publicRepos: user.repositories.totalCount,
        totalStars: repos.reduce((a, r) => a + r.stars, 0),
      },
      contributions: { total: calendar.totalContributions, days },
      repos,
    },
    login,
    'graphql',
  );
}

async function restGet(url, token) {
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'dz-kri-flight-ops',
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

/** Parse the public contributions HTML fragment GitHub serves to browsers. */
function parseContributionsHtml(html) {
  const dayRe =
    /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="contribution-day-component-(\d+)-(\d+)"[^>]*data-level="(\d+)"[^>]*>\s*<\/td>\s*<tool-tip[^>]*>([^<]*)<\/tool-tip>/g;
  const days = [];
  let match;
  while ((match = dayRe.exec(html)) !== null) {
    const [, date, row, col, level, tip] = match;
    const count = /(\d+) contributions?/.exec(tip)?.[1] ?? 0;
    days.push({ date, count: Number(count), level: Number(level), col: Number(col), row: Number(row) });
  }
  if (days.length < 300) throw new Error(`contributions fragment parse got only ${days.length} days`);
  return days;
}

async function scrapeSnapshot(login, token) {
  const [profile, repoList, contribRes] = await Promise.all([
    restGet(`https://api.github.com/users/${login}`, token),
    restGet(`https://api.github.com/users/${login}/repos?per_page=100&sort=pushed`, token),
    fetch(`https://github.com/users/${login}/contributions`, {
      headers: { 'user-agent': 'dz-kri-flight-ops' },
    }),
  ]);
  if (!contribRes.ok) throw new Error(`contributions fragment ${contribRes.status}`);
  const html = await contribRes.text();
  const days = parseContributionsHtml(html);
  const repos = repoList
    .filter((r) => !r.fork)
    .map((r) => ({
      name: r.name,
      language: r.language,
      languageColor: r.language ? langColor(r.language) : '#8b949e',
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
      description: r.description,
      url: r.html_url,
    }));
  return finalize(
    {
      profile: {
        name: profile.name || profile.login,
        followers: profile.followers,
        publicRepos: repos.length,
        totalStars: repos.reduce((a, r) => a + r.stars, 0),
      },
      contributions: { total: days.reduce((a, d) => a + d.count, 0), days },
      repos,
    },
    login,
    'scrape',
  );
}

function finalize(partial, login, source) {
  const repos = [...partial.repos]
    .sort((a, b) => b.stars - a.stars || String(b.pushedAt).localeCompare(String(a.pushedAt)))
    .slice(0, 14);
  return {
    meta: { login, capturedAt: new Date().toISOString(), source },
    profile: partial.profile,
    contributions: partial.contributions,
    streak: computeStreaks(partial.contributions.days),
    languages: aggregateLanguages(partial.repos),
    repos,
  };
}

export function snapshotPath() {
  return SNAPSHOT_PATH;
}

export function loadSnapshot() {
  return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
}

/**
 * Collect a fresh snapshot and write data/snapshot.json.
 * On failure, keeps the existing snapshot if one exists (the strip never
 * goes dark because of a flaky API) and exits 0 with a warning.
 */
export async function fetchSnapshot({ token = process.env.GITHUB_TOKEN, login = LOGIN } = {}) {
  let snapshot = null;
  let error = null;
  if (token) {
    try {
      snapshot = await graphqlSnapshot(token, login);
    } catch (e) {
      error = e;
      console.warn(`GraphQL fetch failed (${e.message}); trying public endpoints.`);
    }
  }
  if (!snapshot) {
    try {
      snapshot = await scrapeSnapshot(login, token);
    } catch (e) {
      error = e;
    }
  }
  if (!snapshot) {
    if (existsSync(SNAPSHOT_PATH)) {
      console.warn(`Could not refresh data (${error.message}); keeping the previous snapshot.`);
      return loadSnapshot();
    }
    throw error;
  }
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(
    `Snapshot ready: ${snapshot.contributions.total} contributions, ` +
      `${snapshot.profile.publicRepos} repos, source=${snapshot.meta.source}.`,
  );
  return snapshot;
}

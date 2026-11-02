// Collect flight data for the profile and write data/snapshot.json.
// Usage: GH_LOGIN=DzKriMo [GITHUB_TOKEN=...] node scripts/fetch.mjs

import { fetchSnapshot } from './lib/github.mjs';

await fetchSnapshot();

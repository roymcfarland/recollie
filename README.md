# recollie

> A tiny, dependency-free Node.js client for searching public US recall APIs. First published in 2014. Modernized to v2.0.0 in 2026. The 12-year gap is the point.

[![npm version](https://img.shields.io/npm/v/recollie.svg)](https://www.npmjs.com/package/recollie)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org/)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-blue.svg)](package.json)

## What this is

`recollie` is a small client library for querying public US recall APIs. You give it a search term; it returns the matching recall records from the upstream API.

It is also a personal artifact. The first version shipped to npm in **2014**, when I was learning JavaScript and building tooling around full-stack work that predated the agentic-AI era. **v2.0.0 shipped in 2026** as a deliberate exercise in maintaining useful developer tooling across a long gap.

The library has stayed honest about what it is the whole time:

- One thing it does well: query public recall data
- Zero runtime dependencies
- Small, readable, typed surface area

## What changed in v2.0.0

- **Node 18+** baseline, native `fetch` (no `node-fetch` dependency)
- **TypeScript declarations** shipped with the package
- **Structured errors** (`RecollieError`) with stable, machine-readable error codes
- **New default data source.** Early versions queried the old USA.gov aggregate recall endpoint, which is no longer active; v2.0.0 defaults to the CPSC recalls API
- **Same zero-runtime-dependency promise** as v1

## Install

```bash
npm install recollie
```

## Quick start

```js
const recollie = require('recollie');

// Searches the CPSC recalls API (the default) by product name.
const recalls = await recollie('crib', { limit: 5 });

for (const recall of recalls) {
  console.log(recall.Title);
}
```

The named `search` export is identical to the default call:

```js
const { search } = require('recollie');

const recalls = await search('crib');
```

## API

```js
const recalls = await recollie(term, options);
```

`term` is a required, non-empty string. `options` is optional:

| Option | Default | Description |
|---|---|---|
| `endpoint` | CPSC recalls API | API endpoint URL. |
| `queryParam` | `"ProductName"` | Query parameter used for the search term. |
| `queryPrefix` | `""` | Prefix added before the term for fielded-search APIs. |
| `params` | `{}` | Extra query parameters (values are stringified). |
| `limit` | `25` | Local cap for array or `{ results: [] }` responses. `null` disables. |
| `timeoutMs` | `10000` | Request timeout in milliseconds. |
| `headers` | `{}` | Additional request headers. |
| `fetch` | `globalThis.fetch` | Custom `fetch` implementation (for tests or non-standard runtimes). |

`recollie` returns the parsed JSON from the upstream API, optionally length-limited. The shape is whatever the endpoint returns — the library does not normalize it.

### Querying other APIs

The endpoint is configurable, so the same client works against other recall APIs. For example, openFDA food enforcement uses `search=product_description:<term>`:

```js
const results = await recollie('peanut butter', {
  endpoint: 'https://api.fda.gov/food/enforcement.json',
  queryParam: 'search',
  queryPrefix: 'product_description:',
  params: { limit: 5 },
  limit: 5,
});
```

### Callbacks

Error-first callbacks are supported, and the legacy success-only callback still works:

```js
recollie('crib', { limit: 5 }, (error, recalls) => {
  if (error) return console.error(error);
  console.log(recalls);
});
```

Prefer the Promise API or error-first callbacks for new code so failures are explicit.

### Errors

Operational failures reject with a `RecollieError` carrying a stable `code`:

`FETCH_UNAVAILABLE` · `HTTP_ERROR` · `INVALID_JSON` · `REQUEST_FAILED` · `TIMEOUT`

`HTTP_ERROR` also carries `status` and `body`. Invalid caller input (such as an empty term) throws a `TypeError`.

```js
try {
  await recollie('crib');
} catch (error) {
  if (error instanceof recollie.RecollieError) {
    console.error(error.code, error.status);
  }
}
```

## Design choices

- **Zero runtime dependencies.** A package that has lived more than a decade in npm has watched a lot of dependencies disappear. This one doesn't have any to lose.
- **Native `fetch` only.** Requires Node 22 or newer.
- **Continuous integration** on push and PR (Node 22 and 24).
- **Server-only.** This is a Node library, not a browser library. CORS for these public APIs is variable and not worth pretending to abstract over.
- **No magic retries.** You get a configurable `timeoutMs` and can supply your own `fetch`; the retry policy is the caller's to choose.

## Why it still ships

I keep this package alive for one reason: it is a verifiable, third-party-hosted (npm registry) record of writing and maintaining production code across a long horizon. That matters more to me than the size of the user base. If it helps you find a recall faster, that is a bonus.

## Where this fits

| Role | Project |
|---|---|
| **This repo** | **`recollie` — [npmjs.com/package/recollie](https://www.npmjs.com/package/recollie)** |
| Author's GitHub profile | [github.com/roymcfarland](https://github.com/roymcfarland) |
| Other public infra repos | [Atlas Beta Bug Reporter](https://brightlinebugs.com) · [Workflow Blueprint](https://workflowblueprint.io) · [Agentic Daily Digest](https://roymcfarland.news) · [Builder & Verifier methodology](https://worksmithlabs.com) |

## Data sources

- Default: [CPSC recalls API](https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information)
- Example: [openFDA food enforcement API](https://open.fda.gov/apis/food/enforcement/)

Recall data can change and may be incomplete. Verify safety-critical decisions with the responsible agency or manufacturer.

## Versioning

Semantic versioning. v1.x is preserved on npm for historical reference. v2.0.0 introduces TypeScript declarations, structured errors, and a new default data source as breaking changes against the v1 surface; everything else attempts to remain familiar.

## License

[MIT](LICENSE).

## Author

Roy McFarland — [brightline.io](https://brightline.io) · [roy@brightline.io](mailto:roy@brightline.io)

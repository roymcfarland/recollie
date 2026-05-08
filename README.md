# recollie

> A tiny, dependency-free Node.js client for searching public US recall APIs. First published in 2015. Modernized to v2.0.0 in 2026. The 11-year gap is the point.

[![npm version](https://img.shields.io/npm/v/recollie.svg)](https://www.npmjs.com/package/recollie)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-blue.svg)](package.json)

## What this is

`recollie` is a small client library for querying public US recall APIs across multiple federal agencies. You give it a query; it returns recall records.

It is also a personal artifact. The first version shipped to npm in **2015**, when I was learning JavaScript and building tooling around full-stack work that predated the agentic-AI era. **v2.0.0 shipped in 2026** as a deliberate exercise in maintaining useful developer tooling across a long gap.

The library has stayed honest about what it is the whole time:

- One thing it does well: query public recall data
- Zero runtime dependencies
- Small, readable, typed surface area

## What changed in v2.0.0

- **Node 18+** baseline, native `fetch` (no `node-fetch` dependency)
- **TypeScript declarations** shipped with the package
- **Structured errors** with stable error codes and machine-readable details
- **Continuous integration** on push and PR
- **Same zero-runtime-dependency promise** as v1

## Install

```bash
npm install recollie
```

## Quick start

```ts
import { search } from "recollie";

const results = await search({
  query: "infant formula",
  agencies: ["fda", "cpsc", "usda"],
  limit: 25,
});

for (const recall of results) {
  console.log(recall.agency, recall.title, recall.recallDate);
}
```

## API

```ts
search(options: SearchOptions): Promise<RecallRecord[]>
```

**`SearchOptions`**

| Field | Type | Default |
|---|---|---|
| `query` | `string` | required |
| `agencies` | `Array<"fda" \| "cpsc" \| "usda" \| "nhtsa">` | all supported |
| `limit` | `number` | 50 |
| `since` | `Date \| string` | undefined |
| `signal` | `AbortSignal` | undefined |

**`RecallRecord`**

| Field | Type |
|---|---|
| `agency` | `"fda" \| "cpsc" \| "usda" \| "nhtsa"` |
| `id` | `string` |
| `title` | `string` |
| `recallDate` | `string` (ISO 8601) |
| `summary` | `string` |
| `url` | `string` |
| `raw` | unmodified upstream payload for the record |

Errors are thrown as `RecollieError` instances with a stable `code` field (`UPSTREAM_ERROR`, `RATE_LIMITED`, `INVALID_QUERY`, etc.) so callers can branch on machine-readable causes.

## Design choices

- **Zero runtime dependencies.** A package that has lived 11 years in npm has watched a lot of dependencies disappear. This one doesn't have any to lose.
- **Native `fetch` only.** Node 18+ is the floor.
- **Server-only.** This is a Node library, not a browser library. CORS for these public APIs is variable and not worth pretending to abstract over.
- **No magic retries.** Callers know their workload better than the library does. Pass an `AbortSignal` and a retry policy of your choosing.

## Why it still ships

I keep this package alive for one reason: it is a verifiable, third-party-hosted (npm registry) record of writing and maintaining production code across a long horizon. That matters more to me than the size of the user base. If it helps you find a recall faster, that is a bonus.

## Where this fits

| Role | Project |
|---|---|
| **This repo** | **`recollie` — [npmjs.com/package/recollie](https://www.npmjs.com/package/recollie)** |
| Author's GitHub profile | [github.com/roymcfarland](https://github.com/roymcfarland) |
| Other public infra repos | [Atlas Beta Bug Reporter](https://brightlinebugs.com) · [Workflow Blueprint](https://workflowblueprint.io) · [Agentic Daily Digest](https://roymcfarland.news) · [Builder & Verifier methodology](https://worksmithlabs.com) |

## Versioning

Semantic versioning. v1.x is preserved on npm for historical reference. v2.0.0 introduces TypeScript declarations and structured errors as breaking changes against the v1 surface; everything else attempts to remain familiar.

## License

[MIT](LICENSE).

## Author

Roy McFarland — [brightline.io](https://brightline.io) · [roy@brightline.io](mailto:roy@brightline.io)

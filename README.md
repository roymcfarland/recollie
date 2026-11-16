# recollie

> A tiny, dependency-free Node.js client for searching public US recall APIs. First published in 2014. Modernized to v2.0.0 in 2026. The 12-year gap is the point.

[![npm version](https://img.shields.io/npm/v/recollie.svg)](https://www.npmjs.com/package/recollie)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-blue.svg)](package.json)

## What this is

`recollie` is a small client library for querying public US recall APIs. It searches the CPSC recalls API by default and returns the upstream JSON. The npm package ships CommonJS JavaScript and TypeScript declarations with zero runtime dependencies.

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

Use Node.js 22 or newer. [package.json](package.json) defines the supported Node.js range.

```bash
npm install recollie
```

## Quick start

```js
const recollie = require('recollie');

async function main() {
  // Searches the CPSC recalls API (the default) by product name.
  const recalls = await recollie('crib', { limit: 5 });

  for (const recall of recalls) {
    console.log(recall.Title);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

For Promise-based calls, `recollie.search(term, options)` returns the same results as the default call. Use `await` inside an async function in CommonJS, as above.

```js
const { search } = require('recollie');

const recalls = await search('crib');
```

## API

```js
const recalls = await recollie(term, options);
```

`term` must be a non-empty string after trimming. `options` is optional.

| Option | Default | Description |
|---|---|---|
| `endpoint` | CPSC recalls API | API endpoint URL. |
| `queryParam` | `"ProductName"` | Query parameter used for the search term. |
| `queryPrefix` | `""` | Prefix added before the term for fielded-search APIs. |
| `params` | `{}` | Extra query parameters. Strings, numbers and booleans are stringified. Null and undefined values are skipped. |
| `limit` | `25` | Positive integer cap applied locally to arrays or to the `results` array in an object. `null` disables the cap. |
| `timeoutMs` | `10000` | Positive integer timeout in milliseconds. A custom fetch must honor the abort signal for the timeout to take effect. |
| `headers` | `{}` | Additional request headers with string values. The default `Accept` header is `application/json`. |
| `fetch` | `globalThis.fetch` | Custom `fetch` implementation, for example to stub HTTP requests in tests. |

`recollie` resolves to upstream JSON in the endpoint’s own shape, with the optional local cap applied. TypeScript declares this result as `unknown`. See [index.d.ts](index.d.ts) for the package’s API types.

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

Pass a callback as the second argument, or as the third argument after options. Callback calls return `undefined`. Declare at least two parameters for an error-first callback.

```js
recollie('crib', { limit: 5 }, (error, recalls) => {
  if (error) return console.error(error);
  console.log(recalls);
});
```

A callback with fewer than two declared parameters is called with the result on success. On failure, Recollie throws the error in a microtask. Prefer the Promise API or a two-parameter callback to handle failures directly.

### Errors

Operational failures reject with a `RecollieError` carrying a stable `code`:

`FETCH_UNAVAILABLE` · `HTTP_ERROR` · `INVALID_JSON` · `REQUEST_FAILED` · `TIMEOUT`

`HTTP_ERROR` carries `status` and the response `body`. `INVALID_JSON` also carries the response `body`. Invalid search input such as an empty term rejects with `TypeError`. An invalid callback argument throws `TypeError` synchronously.

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
- **Native `fetch` by default.** The library uses Node’s built-in `fetch` unless the caller supplies one.
- **Server-only.** This is a Node library, not a browser library. CORS for these public APIs is variable and not worth pretending to abstract over.
- **No magic retries.** You get a configurable `timeoutMs` and can supply your own `fetch`; the retry policy is the caller's to choose.

## Development

Use the npm that ships with a supported Node.js version and install from the project’s [npm lockfile](package-lock.json).

```bash
npm ci
npm test
npm run pack:check
```

Tests use Node’s built-in test runner and stub HTTP requests. `npm run check` runs the tests and package dry run together. The library ships JavaScript and declarations directly, so the package dry run is the packaging check. Configuration is passed through the API options. Recollie reads no environment variables.

### Pull requests and releases

Make changes through pull requests to `main` and include any related documentation in the same PR. Delete the branch after merge. Run `git worktree remove` with the scratch checkout’s path when you finish using one.

[CI](.github/workflows/ci.yml) runs the install, test and package dry run on pull requests and pushes to `main`. To merge into `main`, the PR branch must be up to date and both the Node 22 and Node 24 checks must pass. Releases are published separately to npm. The `prepublishOnly` hook runs the tests and package dry run before publication.

### Security and automation

[Dependabot](.github/dependabot.yml) checks GitHub Actions monthly, groups updates and allows up to three open update PRs. See [SECURITY.md](SECURITY.md) for how to report vulnerabilities through GitHub private vulnerability reporting.

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

Semantic versioning. v1.x is preserved on npm for historical reference. v2.0.0 introduces TypeScript declarations, structured errors, and a new default data source as breaking changes against the v1 surface; everything else attempts to remain familiar. v3.0.0 drops support for Node 18 and 20 and requires Node 22 or newer as a breaking change, and v2.x remains available on npm for those runtimes.

## License

[MIT](LICENSE).

## Author

Roy McFarland — [brightline.io](https://brightline.io) · [roy@brightline.io](mailto:roy@brightline.io)

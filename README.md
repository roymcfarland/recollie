# Recollie

A tiny, dependency-free Node.js client for searching public recall APIs.

Recollie gives you a small wrapper around recall search endpoints with sensible defaults, predictable errors, timeouts, Promise support, callback compatibility, and TypeScript declarations.

By default, Recollie queries the U.S. Consumer Product Safety Commission's current HTTPS recalls API. Early Recollie releases used the old USA.gov aggregate recall endpoint, which is no longer active.

## Features

- Dependency-free, CommonJS, Node.js 18+
- Promise API with error-first callback support
- Built-in timeout handling with structured `RecollieError`s
- Configurable endpoint, query parameter, query prefix, headers, and extra params
- TypeScript declarations included
- Local response limiting for APIs that return arrays or `{ results: [] }`

## Install

```sh
npm install recollie
```

## Quick Start

```js
const recollie = require('recollie');

async function main() {
  const recalls = await recollie('crib', { limit: 5 });

  for (const recall of recalls) {
    console.log(recall.Title);
  }
}

main().catch(console.error);
```

## API

```js
const recalls = await recollie(term, options);
```

`term` must be a non-empty string. `options` is optional.

```js
const recalls = await recollie('crib', {
  endpoint: 'https://www.saferproducts.gov/RestWebServices/Recall?format=json',
  queryParam: 'ProductName',
  queryPrefix: '',
  params: {},
  limit: 25,
  timeoutMs: 10000,
  headers: {},
});
```

| Option | Default | Description |
| --- | --- | --- |
| `endpoint` | CPSC recalls API | API endpoint URL. |
| `queryParam` | `ProductName` | Query parameter used for the search term. |
| `queryPrefix` | `''` | Prefix added before the search term for fielded search APIs. |
| `params` | `{}` | Additional query parameters. Values are stringified. |
| `limit` | `25` | Local maximum for array responses or `{ results: [] }`. Use `null` to disable. |
| `timeoutMs` | `10000` | Request timeout in milliseconds. |
| `headers` | `{}` | Additional request headers. |
| `fetch` | `globalThis.fetch` | Custom fetch implementation for tests or non-standard runtimes. |

You can also call the named `search` export:

```js
const { search } = require('recollie');

const recalls = await search('crib');
```

## Callbacks

Error-first callbacks are supported:

```js
recollie('crib', { limit: 5 }, (error, recalls) => {
  if (error) {
    console.error(error);
    return;
  }

  console.log(recalls);
});
```

The historical one-argument success callback still works for successful responses:

```js
recollie('crib', (recalls) => {
  console.log(recalls);
});
```

Prefer the Promise API or error-first callbacks for new code so failures are explicit.

## Other APIs

Recollie can query endpoints with different search conventions. For example, openFDA food enforcement uses `search=product_description:<term>`:

```js
const results = await recollie('peanut butter', {
  endpoint: 'https://api.fda.gov/food/enforcement.json',
  queryParam: 'search',
  queryPrefix: 'product_description:',
  params: { limit: 5 },
  limit: 5,
});
```

## Errors

Operational failures reject with `RecollieError`.

```js
try {
  await recollie('crib');
} catch (error) {
  if (error instanceof recollie.RecollieError) {
    console.error(error.code, error.status);
  }
}
```

Possible `code` values:

- `FETCH_UNAVAILABLE`
- `HTTP_ERROR`
- `INVALID_JSON`
- `REQUEST_FAILED`
- `TIMEOUT`

Invalid caller input, such as an empty search term, rejects with a `TypeError`.

## Data Sources

- Default: [CPSC recalls API](https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information)
- Example: [openFDA food enforcement API](https://open.fda.gov/apis/food/enforcement/)

Recall data can change and may be incomplete. Verify safety-critical decisions with the responsible agency or manufacturer.

## Development

```sh
npm install
npm run check
```

`npm run check` runs the test suite and verifies the package contents with `npm pack --dry-run`.

## License

MIT

# Recollie

Recollie is a tiny Node.js client for searching public recall APIs.

The package now defaults to the Consumer Product Safety Commission's current HTTPS recall API. The original USA.gov aggregate endpoint used by early Recollie releases is no longer active.

Recall data can change and may be incomplete. Verify safety-critical decisions with the responsible agency or manufacturer.

## Install

```sh
npm install recollie
```

## Usage

```js
const recollie = require('recollie');

async function main() {
  const results = await recollie('crib');
  console.log(results);
}

main().catch(console.error);
```

Error-first callbacks are supported too:

```js
const recollie = require('recollie');

recollie('crib', (error, results) => {
  if (error) {
    console.error(error);
    return;
  }

  console.log(results);
});
```

The historical one-argument callback shape still works for successful responses:

```js
recollie('crib', (results) => {
  console.log(results);
});
```

## Options

```js
const results = await recollie('crib', {
  limit: 10,
  timeoutMs: 5000,
});
```

- `endpoint`: API endpoint URL. Defaults to CPSC's recall API.
- `queryParam`: query parameter name. Defaults to `ProductName`.
- `queryPrefix`: optional prefix for APIs that expect fielded search syntax.
- `params`: additional query parameters to include in the request.
- `limit`: maximum number of returned items when the response is an array or has a `results` array. Defaults to `25`; pass `null` to disable local limiting.
- `timeoutMs`: request timeout in milliseconds. Defaults to `10000`.
- `headers`: additional HTTP headers.
- `fetch`: custom fetch implementation, mostly useful for tests.

For example, openFDA food enforcement searches can be queried like this:

```js
const results = await recollie('peanut butter', {
  endpoint: 'https://api.fda.gov/food/enforcement.json',
  queryParam: 'search',
  queryPrefix: 'product_description:',
  params: { limit: 5 },
  limit: 5,
});
```

## Data Sources

- Default: [CPSC recalls API](https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information)
- Example: [openFDA food enforcement API](https://open.fda.gov/apis/food/enforcement/)

## Development

```sh
npm test
npm run pack:check
```

## License

MIT

'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const recollie = require('../index');

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: 200,
    ...init,
  });
}

test('searches CPSC by product name by default', async () => {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ options, url: String(url) });
    return jsonResponse({ results: [] });
  };

  const results = await recollie(' peanut butter ', {
    endpoint: 'https://example.test/search.json?format=json',
    fetch,
  });

  assert.deepEqual(results, { results: [] });
  assert.equal(
    calls[0].url,
    'https://example.test/search.json?format=json&ProductName=peanut+butter'
  );
  assert.equal(calls[0].options.headers.Accept, 'application/json');
  assert.ok(calls[0].options.signal instanceof AbortSignal);
});

test('supports alternate API query formats', async () => {
  const calls = [];
  const fetch = async (url) => {
    calls.push(String(url));
    return jsonResponse({ results: ['ok'] });
  };

  const results = await recollie('peanut butter', {
    endpoint: 'https://api.fda.gov/food/enforcement.json',
    fetch,
    limit: 1,
    params: { limit: 1 },
    queryParam: 'search',
    queryPrefix: 'product_description:',
  });

  assert.deepEqual(results, { results: ['ok'] });
  assert.equal(
    calls[0],
    'https://api.fda.gov/food/enforcement.json?limit=1&search=product_description%3Apeanut+butter'
  );
});

test('limits array responses locally', async () => {
  const fetch = async () => jsonResponse(['a', 'b', 'c']);

  assert.deepEqual(await recollie('crib', { fetch, limit: 2 }), ['a', 'b']);
});

test('can leave response sizes untouched', async () => {
  const fetch = async () => jsonResponse(['a', 'b', 'c']);

  assert.deepEqual(await recollie('crib', { fetch, limit: null }), [
    'a',
    'b',
    'c',
  ]);
});

test('rejects invalid search terms before making a request', async () => {
  let called = false;
  const fetch = async () => {
    called = true;
    return jsonResponse({});
  };

  await assert.rejects(recollie('   ', { fetch }), {
    message: 'Recollie search term cannot be empty.',
    name: 'TypeError',
  });
  assert.equal(called, false);
});

test('rejects invalid callbacks', async () => {
  assert.throws(() => recollie('crib', {}, 'not a callback'), {
    message: 'Recollie callback must be a function.',
    name: 'TypeError',
  });
});

test('rejects invalid header and param values', async () => {
  const fetch = async () => jsonResponse({});

  await assert.rejects(recollie('crib', { fetch, headers: { 'x-bad': 1 } }), {
    message: 'Recollie header values must be strings.',
    name: 'TypeError',
  });

  await assert.rejects(recollie('crib', { fetch, params: { bad: {} } }), {
    message:
      'Recollie param values must be strings, numbers, booleans, null, or undefined.',
    name: 'TypeError',
  });
});

test('wraps non-2xx responses in a RecollieError', async () => {
  const fetch = async () =>
    new Response('upstream unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

  await assert.rejects(recollie('crib', { fetch }), {
    code: 'HTTP_ERROR',
    name: 'RecollieError',
    status: 503,
  });
});

test('wraps timeouts in a RecollieError', async () => {
  const fetch = async (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener(
        'abort',
        () => reject(new DOMException('aborted', 'AbortError')),
        { once: true }
      );
    });

  await assert.rejects(recollie('crib', { fetch, timeoutMs: 1 }), {
    code: 'TIMEOUT',
    name: 'RecollieError',
  });
});

test('wraps malformed JSON responses in a RecollieError', async () => {
  const fetch = async () =>
    new Response('not json', {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });

  await assert.rejects(recollie('crib', { fetch }), {
    code: 'INVALID_JSON',
    name: 'RecollieError',
  });
});

test('supports error-first callbacks', async () => {
  const fetch = async () => jsonResponse({ results: ['ok'] });

  await new Promise((resolve, reject) => {
    recollie('crib', { fetch }, (error, results) => {
      try {
        assert.equal(error, null);
        assert.deepEqual(results, { results: ['ok'] });
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });
});

test('keeps the legacy success callback shape', async () => {
  const fetch = async () => jsonResponse({ results: ['ok'] });

  await new Promise((resolve, reject) => {
    recollie('crib', { fetch }, (results) => {
      try {
        assert.deepEqual(results, { results: ['ok'] });
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });
});

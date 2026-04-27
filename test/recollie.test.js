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

'use strict';

const DEFAULT_ENDPOINT =
  'https://www.saferproducts.gov/RestWebServices/Recall?format=json';
const DEFAULT_LIMIT = 25;
const DEFAULT_QUERY_PARAM = 'ProductName';
const DEFAULT_TIMEOUT_MS = 10_000;

class RecollieError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = 'RecollieError';

    if (options.code) this.code = options.code;
    if (options.status !== undefined) this.status = options.status;
    if (options.body !== undefined) this.body = options.body;
  }
}

function normalizeSearchTerm(term) {
  if (typeof term !== 'string') {
    throw new TypeError('Recollie search term must be a string.');
  }

  const normalized = term.trim();
  if (!normalized) {
    throw new TypeError('Recollie search term cannot be empty.');
  }

  return normalized;
}

function normalizeOptions(options) {
  if (options === undefined || options === null) return {};
  if (!isObjectRecord(options)) {
    throw new TypeError('Recollie options must be an object.');
  }

  return options;
}

function normalizeConfig(options) {
  const config = normalizeOptions(options);
  const endpoint = normalizeString(
    config.endpoint,
    'endpoint',
    DEFAULT_ENDPOINT
  ).trim();
  const queryParam = normalizeString(
    config.queryParam,
    'queryParam',
    DEFAULT_QUERY_PARAM
  ).trim();

  if (!endpoint) throw new TypeError('Recollie endpoint cannot be empty.');
  if (!queryParam) throw new TypeError('Recollie queryParam cannot be empty.');

  return {
    endpoint,
    fetchImplementation: normalizeFetch(config.fetch),
    headers: normalizeHeaders(config.headers),
    limit: normalizePositiveInteger(config.limit, 'limit', DEFAULT_LIMIT, {
      allowNull: true,
    }),
    params: normalizeParams(config.params),
    queryParam,
    queryPrefix: normalizeString(config.queryPrefix, 'queryPrefix'),
    timeoutMs: normalizePositiveInteger(
      config.timeoutMs,
      'timeoutMs',
      DEFAULT_TIMEOUT_MS
    ),
  };
}

function normalizeFetch(fetchImplementation) {
  const resolved =
    fetchImplementation === undefined ? globalThis.fetch : fetchImplementation;

  if (typeof resolved !== 'function') {
    throw new RecollieError('No fetch implementation is available.', {
      code: 'FETCH_UNAVAILABLE',
    });
  }

  return resolved;
}

function normalizeRecord(value, name) {
  if (value === undefined) return {};
  if (!isObjectRecord(value)) {
    throw new TypeError(`Recollie ${name} must be an object.`);
  }

  return value;
}

function normalizeHeaders(headers) {
  const normalized = normalizeRecord(headers, 'headers');

  for (const value of Object.values(normalized)) {
    if (value !== undefined && typeof value !== 'string') {
      throw new TypeError('Recollie header values must be strings.');
    }
  }

  return normalized;
}

function normalizeParams(params) {
  const normalized = normalizeRecord(params, 'params');
  const allowedTypes = new Set(['boolean', 'number', 'string']);

  for (const value of Object.values(normalized)) {
    if (
      value !== undefined &&
      value !== null &&
      !allowedTypes.has(typeof value)
    ) {
      throw new TypeError(
        'Recollie param values must be strings, numbers, booleans, null, or undefined.'
      );
    }
  }

  return normalized;
}

function normalizePositiveInteger(value, name, fallback, options = {}) {
  if (value === undefined) return fallback;
  if (options.allowNull && value === null) return null;
  if (!Number.isInteger(value) || value <= 0) {
    const suffix = options.allowNull ? ' or null' : '';
    throw new TypeError(`Recollie ${name} must be a positive integer${suffix}.`);
  }

  return value;
}

function normalizeString(value, name, fallback = '') {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') {
    throw new TypeError(`Recollie ${name} must be a string.`);
  }

  return value;
}

function isObjectRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildSearchUrl(term, config) {
  const url = new URL(config.endpoint);

  for (const [key, value] of Object.entries(config.params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.set(config.queryParam, `${config.queryPrefix}${term}`);
  return url;
}

async function requestJson(url, config) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await config.fetchImplementation(url, {
      headers: {
        Accept: 'application/json',
        ...config.headers,
      },
      signal: controller.signal,
    });

    return await parseJsonResponse(response);
  } catch (error) {
    if (error instanceof RecollieError) throw error;

    if (error && error.name === 'AbortError') {
      throw new RecollieError(
        `Recall API request timed out after ${config.timeoutMs}ms.`,
        {
          cause: error,
          code: 'TIMEOUT',
        }
      );
    }

    throw new RecollieError('Recall API request failed.', {
      cause: error,
      code: 'REQUEST_FAILED',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseJsonResponse(response) {
  const body = await response.text();

  if (!response.ok) {
    const statusText = response.statusText || 'Error';

    throw new RecollieError(
      `Recall API returned ${response.status} ${statusText}.`,
      {
        body,
        code: 'HTTP_ERROR',
        status: response.status,
      }
    );
  }

  try {
    return JSON.parse(body);
  } catch (cause) {
    throw new RecollieError('Recall API returned invalid JSON.', {
      body,
      cause,
      code: 'INVALID_JSON',
    });
  }
}

function limitResults(data, limit) {
  if (limit === null) return data;
  if (Array.isArray(data)) return data.slice(0, limit);

  if (data && Array.isArray(data.results)) {
    return {
      ...data,
      results: data.results.slice(0, limit),
    };
  }

  return data;
}

async function search(term, options) {
  const config = normalizeConfig(options);
  const url = buildSearchUrl(normalizeSearchTerm(term), config);
  const data = await requestJson(url, config);

  return limitResults(data, config.limit);
}

function recollie(term, options, callback) {
  const { done, searchOptions } = normalizeCall(options, callback);
  const promise = search(term, searchOptions);

  if (!done) return promise;

  callCallback(done, promise);
  return undefined;
}

function normalizeCall(options, callback) {
  if (typeof options === 'function') {
    return { done: options, searchOptions: undefined };
  }

  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('Recollie callback must be a function.');
  }

  return { done: callback, searchOptions: options };
}

function callCallback(callback, promise) {
  promise.then(
    (results) => {
      if (callback.length >= 2) {
        callback(null, results);
        return;
      }

      callback(results);
    },
    (error) => {
      if (callback.length >= 2) {
        callback(error);
        return;
      }

      queueMicrotask(() => {
        throw error;
      });
    }
  );
}

module.exports = Object.assign(recollie, {
  DEFAULT_ENDPOINT,
  DEFAULT_LIMIT,
  DEFAULT_QUERY_PARAM,
  DEFAULT_TIMEOUT_MS,
  RecollieError,
  search,
});

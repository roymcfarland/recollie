'use strict';

const DEFAULT_ENDPOINT = 'https://www.saferproducts.gov/RestWebServices/Recall?format=json';
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

  const query = term.trim();
  if (!query) {
    throw new TypeError('Recollie search term cannot be empty.');
  }

  return query;
}

function normalizeOptions(options) {
  if (options === undefined || options === null) return {};
  if (!options || typeof options !== 'object') {
    throw new TypeError('Recollie options must be an object.');
  }

  return options;
}

function normalizeObjectOption(value, name) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Recollie ${name} must be an object.`);
  }

  return value;
}

function normalizeStringOption(value, name, defaultValue = '') {
  if (value === undefined) return defaultValue;
  if (typeof value !== 'string') {
    throw new TypeError(`Recollie ${name} must be a string.`);
  }

  return value;
}

function normalizeLimit(limit = DEFAULT_LIMIT) {
  if (limit === null) return null;

  const value = Number(limit);
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError('Recollie limit must be a positive integer or null.');
  }

  return value;
}

function normalizeTimeoutMs(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const value = Number(timeoutMs);

  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError('Recollie timeoutMs must be a positive integer.');
  }

  return value;
}

function buildSearchUrl(term, options) {
  const {
    endpoint = DEFAULT_ENDPOINT,
    params,
    queryParam = DEFAULT_QUERY_PARAM,
    queryPrefix,
  } = options;
  const url = new URL(endpoint);
  const additionalParams = normalizeObjectOption(params, 'params');
  const parameterName = normalizeStringOption(
    queryParam,
    'queryParam',
    DEFAULT_QUERY_PARAM
  ).trim();
  const prefix = normalizeStringOption(queryPrefix, 'queryPrefix');

  if (!parameterName) {
    throw new TypeError('Recollie queryParam cannot be empty.');
  }

  for (const [key, value] of Object.entries(additionalParams)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.set(parameterName, `${prefix}${term}`);
  return url;
}

async function parseJsonResponse(response) {
  const body = await response.text();

  if (!response.ok) {
    throw new RecollieError(
      `Recall API returned ${response.status} ${response.statusText || 'Error'}.`,
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

  if (Array.isArray(data)) {
    return data.slice(0, limit);
  }

  if (data && Array.isArray(data.results)) {
    return {
      ...data,
      results: data.results.slice(0, limit),
    };
  }

  return data;
}

async function search(term, options) {
  const query = normalizeSearchTerm(term);
  const config = normalizeOptions(options);
  const {
    fetch: fetchImplementation = globalThis.fetch,
    headers,
    limit,
    timeoutMs,
  } = config;
  const requestHeaders = normalizeObjectOption(headers, 'headers');
  const resultLimit = normalizeLimit(limit);

  if (typeof fetchImplementation !== 'function') {
    throw new RecollieError('No fetch implementation is available.', {
      code: 'FETCH_UNAVAILABLE',
    });
  }

  const controller = new AbortController();
  const timeout = normalizeTimeoutMs(timeoutMs);
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetchImplementation(buildSearchUrl(query, config), {
      headers: {
        Accept: 'application/json',
        ...requestHeaders,
      },
      signal: controller.signal,
    });

    return limitResults(await parseJsonResponse(response), resultLimit);
  } catch (error) {
    if (error instanceof RecollieError) throw error;

    if (error && error.name === 'AbortError') {
      throw new RecollieError(`Recall API request timed out after ${timeout}ms.`, {
        cause: error,
        code: 'TIMEOUT',
      });
    }

    throw new RecollieError('Recall API request failed.', {
      cause: error,
      code: 'REQUEST_FAILED',
    });
  } finally {
    clearTimeout(timeoutId);
  }
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

function recollie(term, options, callback) {
  const done = typeof options === 'function' ? options : callback;
  const config = typeof options === 'function' ? undefined : options;
  const promise = search(term, config);

  if (typeof done === 'function') {
    callCallback(done, promise);
    return undefined;
  }

  return promise;
}

module.exports = recollie;
module.exports.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT;
module.exports.DEFAULT_LIMIT = DEFAULT_LIMIT;
module.exports.DEFAULT_QUERY_PARAM = DEFAULT_QUERY_PARAM;
module.exports.DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;
module.exports.RecollieError = RecollieError;
module.exports.search = search;

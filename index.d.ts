declare function recollie(
  term: string,
  options?: recollie.Options
): Promise<unknown>;

declare function recollie(
  term: string,
  callback: recollie.LegacyCallback
): void;

declare function recollie(
  term: string,
  callback: recollie.Callback
): void;

declare function recollie(
  term: string,
  options: recollie.Options,
  callback: recollie.LegacyCallback
): void;

declare function recollie(
  term: string,
  options: recollie.Options,
  callback: recollie.Callback
): void;

declare namespace recollie {
  const DEFAULT_ENDPOINT: string;
  const DEFAULT_LIMIT: number;
  const DEFAULT_QUERY_PARAM: string;
  const DEFAULT_TIMEOUT_MS: number;

  function search(term: string, options?: Options): Promise<unknown>;

  class RecollieError extends Error {
    readonly body?: string;
    readonly code?:
      | 'FETCH_UNAVAILABLE'
      | 'HTTP_ERROR'
      | 'INVALID_JSON'
      | 'REQUEST_FAILED'
      | 'TIMEOUT';
    readonly status?: number;
  }

  type Callback = (error: Error | null, results?: unknown) => void;
  type LegacyCallback = (results: unknown) => void;

  type FetchLike = (
    url: URL,
    init: {
      headers: Record<string, string>;
      signal: AbortSignal;
    }
  ) => Promise<ResponseLike>;

  interface ResponseLike {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText?: string;
    text(): Promise<string>;
  }

  interface Options {
    endpoint?: string;
    fetch?: FetchLike;
    headers?: Record<string, string>;
    limit?: number | null;
    params?: Record<string, string | number | boolean | null | undefined>;
    queryParam?: string;
    queryPrefix?: string;
    timeoutMs?: number;
  }
}

export = recollie;

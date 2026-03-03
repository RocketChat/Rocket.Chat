/**
 * Modern re-exports of the native browser/Node APIs.
 * In most modern codebases, you can use `globalThis.URL` directly without importing.
 */
export class URL extends globalThis.URL {
    static _constructUrl = (url: string, query?: string | null, params?: Record<string, any>): string => {
        return constructUrl(url, query, params);
    };
}
export const URLSearchParams = globalThis.URLSearchParams;

/**
 * Encodes a string for URL inclusion, handling specific character escapes.
 */
const encodeString = (str: string | number | boolean): string => {
  return encodeURIComponent(String(str)).replace(/\*/g, '%2A');
};

/**
 * Encode URL parameters into a query string, handling nested objects and
 * arrays properly (e.g., `filter[type]=Foo`).
 * * Replaces the legacy `URL._encodeParams`
 */
export const encodeParams = (params: Record<string, any>, prefix?: string): string => {
  const str: string[] = [];
  const isParamsArray = Array.isArray(params);

  for (const p in params) {
    if (Object.prototype.hasOwnProperty.call(params, p)) {
      const k = prefix ? `${prefix}[${isParamsArray ? '' : p}]` : p;
      const v = params[p];

      if (typeof v === 'object' && v !== null) {
        str.push(encodeParams(v, k));
      } else {
        const encodedKey = encodeString(k).replace(/%5B/g, '[').replace(/%5D/g, ']');
        str.push(`${encodedKey}=${encodeString(v)}`);
      }
    }
  }

  return str.join('&').replace(/%20/g, '+');
};

/**
 * Constructs a URL with optional query strings and nested parameters.
 * * Replaces the legacy `URL._constructUrl`
 */
export const constructUrl = (
  url: string,
  query?: string | null,
  params?: Record<string, any>
): string => {
  const queryMatch = /^(.*?)(\?.*)?$/.exec(url);
  
  // Safely fallback to original URL if regex fails (though highly unlikely)
  if (!queryMatch) return url;

  const urlWithoutQuery = queryMatch[1];
  const fromQmark = queryMatch[2];

  let finalQuery = fromQmark ? fromQmark.slice(1) : null;

  if (typeof query === "string") {
    finalQuery = String(query);
  }

  if (params) {
    finalQuery = finalQuery || "";
    const prms = encodeParams(params);
    if (finalQuery && prms) {
      finalQuery += '&';
    }
    finalQuery += prms;
  }

  let finalUrl = urlWithoutQuery;
  if (finalQuery !== null) {
    finalUrl += `?${finalQuery}`;
  }

  return finalUrl;
};
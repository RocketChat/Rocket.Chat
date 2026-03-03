export interface AbsoluteUrlOptions {
  secure?: boolean;
  replaceLocalhost?: boolean;
  rootUrl?: string;
}

/**
 * Generate an absolute URL pointing to the application.
 */
export function absoluteUrl(
  pathOrOptions?: string | AbsoluteUrlOptions,
  options?: AbsoluteUrlOptions
): string {
  let path: string | undefined;
  let opts: AbsoluteUrlOptions | undefined;

  // Distinguish between absoluteUrl(options) and absoluteUrl(path, options)
  if (typeof pathOrOptions === "object" && pathOrOptions !== null) {
    opts = pathOrOptions;
    path = undefined;
  } else {
    path = pathOrOptions as string | undefined;
    opts = options;
  }

  // Merge options with defaults
  const mergedOptions = { ...absoluteUrl.defaultOptions, ...(opts || {}) };

  let url = mergedOptions.rootUrl;
  if (!url) {
    throw new Error(
      "Must pass options.rootUrl or set ROOT_URL in the server environment (or global config)"
    );
  }

  if (!/^http[s]?:\/\//i.test(url)) {
    url = "http://" + url; // Will be fixed to https later if secure is set
  }

  if (!url.endsWith("/")) {
    url += "/";
  }

  if (path) {
    // Join url and path with a / separator
    while (path.startsWith("/")) {
      path = path.slice(1);
    }
    url += path;
  }

  // Turn http to https if secure option is set, and we're not talking to localhost.
  if (
    mergedOptions.secure &&
    /^http:/.test(url) &&
    !/http:\/\/localhost[:\/]/.test(url) &&
    !/http:\/\/127\.0\.0\.1[:\/]/.test(url)
  ) {
    url = url.replace(/^http:/, "https:");
  }

  if (mergedOptions.replaceLocalhost) {
    url = url.replace(/^http:\/\/localhost([:\/].*)/, "http://127.0.0.1$1");
  }

  return url;
}

// Allow later configuration to override default options
absoluteUrl.defaultOptions = {} as AbsoluteUrlOptions;

// Polyfill check for Meteor's legacy runtime config, falling back to window.location
const _global = globalThis as Record<string, any>;
const location = typeof window === "object" && window.location ? window.location : null;

if (typeof _global.__meteor_runtime_config__ === "object" && _global.__meteor_runtime_config__?.ROOT_URL) {
  absoluteUrl.defaultOptions.rootUrl = _global.__meteor_runtime_config__.ROOT_URL;
} else if (location && location.protocol && location.host) {
  absoluteUrl.defaultOptions.rootUrl = location.protocol + "//" + location.host;
}

// Make absolute URLs use HTTPS by default if the current window.location uses HTTPS.
if (location && location.protocol === "https:") {
  absoluteUrl.defaultOptions.secure = true;
}

/**
 * Prepends the application path prefix to a given link if configured.
 */
export function _relativeToSiteRootUrl(link: string): string {
  if (typeof _global.__meteor_runtime_config__ === "object" && link.startsWith("/")) {
    link = (_global.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "") + link;
  }
  return link;
}
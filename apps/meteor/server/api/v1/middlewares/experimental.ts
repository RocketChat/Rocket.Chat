import type { MiddlewareHandler } from 'hono';

// `x-experimental` is the supported programmatic signal. `Warning: 299` is emitted for
// legacy tooling only — warn code 299 came from RFC 7234, which RFC 9111 has obsoleted
// along with the `Warning` header itself.
const WARNING_HEADER = '299 - "experimental: endpoint is unstable and may change without notice"';

/**
 * Stamps every experimental response with the unstable signal headers.
 *
 * Registered on the shared `/api` mount ahead of `cors`, and scoped by path rather than by
 * router: `cors` answers rejected preflights with 403/405 without calling `next()`, so a
 * middleware living on `API.experimental.router` would never run for those responses.
 *
 * The headers are set on `c.res.headers` before the downstream handlers run; Hono merges them
 * into whatever response is produced later, so 404s and CORS rejections are covered too.
 */
export const experimentalWarningMiddleware =
	({ basePathRegex }: { basePathRegex: RegExp }): MiddlewareHandler =>
	async (c, next) => {
		if (!basePathRegex.test(c.req.path)) {
			return next();
		}

		c.res.headers.set('x-experimental', 'true');
		c.res.headers.set('Warning', WARNING_HEADER);

		await next();
	};

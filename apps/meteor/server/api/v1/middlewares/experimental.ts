import type { MiddlewareHandler } from 'hono';

// RFC 7234 "miscellaneous persistent warning" code. Paired with the
// programmatic-friendly `x-experimental` header so clients can detect, in code,
// that they hit an unstable endpoint.
const WARNING_HEADER = '299 - "experimental: endpoint is unstable and may change without notice"';

/**
 * Stamps every response from the experimental API instance with the unstable
 * signal headers. Registered on `API.experimental` only — `/api/v1/*` and the
 * default router never see these headers.
 *
 * Mirrors the header-writing pattern of `writeDeprecationHeader` in
 * `deprecationWarningLogger.ts`: the headers are set on `c.res.headers` before
 * the route handler runs so they are picked up when the handler builds the
 * final response (see `Router.method` in `@rocket.chat/http-router`).
 */
export const experimentalWarningMiddleware = (): MiddlewareHandler => async (c, next) => {
	c.res.headers.set('x-experimental', 'true');
	c.res.headers.set('Warning', WARNING_HEADER);
	await next();
};

import type { MiddlewareHandler } from 'hono';

import { tracerSpan } from '../index';

/**
 * Generic tracing middleware for Hono-based HTTP routers.
 * Creates a span for each HTTP request.
 *
 * @returns Hono middleware handler
 *
 * @example
 * router.use(tracerSpanMiddleware());
 */
export function tracerSpanMiddleware(): MiddlewareHandler {
	return async (c, next) => {
		const attributes: Record<string, string | number | boolean | undefined> = {
			url: c.req.url,
			method: c.req.method,
		};

		// Try to get userId from Hono context if available (for regular API routes)
		const userId = c.get('userId') ?? c.get('user')?.id;
		if (userId) {
			attributes.userId = userId;
		}

		return tracerSpan(
			`${c.req.method} ${c.req.url}`,
			{
				attributes,
			},
			async (span) => {
				if (span) {
					c.header('X-Trace-Id', span.spanContext().traceId);
				}

				await next();

				span?.setAttribute('status', c.res.status);
			},
		);
	};
}

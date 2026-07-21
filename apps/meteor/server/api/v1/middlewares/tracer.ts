import { isTracingEnabled, tracerSpan } from '@rocket.chat/tracing';
import type { MiddlewareHandler } from 'hono';

export const tracerSpanMiddleware: MiddlewareHandler = async (c, next) => {
	if (!isTracingEnabled()) {
		return next();
	}

	return tracerSpan(
		`${c.req.method} ${c.req.url}`,
		{
			attributes: {
				url: c.req.url,
				method: c.req.method,
			},
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

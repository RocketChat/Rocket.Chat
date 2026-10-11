import { tracerSpan } from '@rocket.chat/tracing';
import type { MiddlewareHandler } from 'hono';

export const tracerSpanMiddleware: MiddlewareHandler = async (c, next) => {
	return tracerSpan(
		`${c.req.method} ${c.req.url}`,
		{
			attributes: {
				url: c.req.url,
				// route: c.req.route?.path,
				method: c.req.method,
				userId: (c.req.raw.clone() as any).userId, // Assuming userId is attached to the request object
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

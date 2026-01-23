import type { Logger } from '@rocket.chat/logger';
import type { MiddlewareHandler } from 'hono';

import { getRestPayload } from '../../../../server/lib/logger/logPayloads';

export const loggerMiddleware =
	(logger: Logger): MiddlewareHandler =>
	async (c, next) => {
		const startTime = Date.now();

		let payload = {};

		// We don't want to consume the request body stream for multipart requests
		if (!c.req.header('content-type')?.includes('multipart/form-data')) {
			try {
				payload = await c.req.raw.clone().json();
				// eslint-disable-next-line no-empty
			} catch {}
		} else {
			payload = '[multipart/form-data]';
		}

		const log = logger.logger.child({
			method: c.req.method,
			url: c.req.url,
			userId: c.req.header('x-user-id'),
			userAgent: c.req.header('user-agent'),
			length: c.req.header('content-length'),
			host: c.req.header('host'),
			referer: c.req.header('referer'),
			remoteIP: c.get('remoteAddress'),
			...(['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method) && getRestPayload(payload)),
		});

		await next();

		log.http({
			status: c.res.status,
			responseTime: Date.now() - startTime,
		});
	};

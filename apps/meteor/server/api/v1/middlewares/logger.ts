import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Logger } from '@rocket.chat/logger';
import { censorUrl } from '@rocket.chat/tools';
import type { MiddlewareHandler } from 'hono';

import { getRemoteAddress } from './remoteAddressMiddleware';
import { getRestPayload } from '../../../lib/logger/logPayloads';

export const loggerMiddleware =
	(logger: Logger): MiddlewareHandler =>
	async (c, next) => {
		const startTime = Date.now();

		const log = logger.logger.child(
			{
				method: c.req.method,
				url: censorUrl(c.req.url),
				userId: c.req.header('x-user-id'),
				userAgent: c.req.header('user-agent'),
				length: c.req.header('content-length'),
				host: c.req.header('host'),
				referer: c.req.header('referer'),
				remoteIP: c.get('remoteAddress'),
				...(['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method) && (await getRestPayload(c.req))),
			},
			{
				redact: [
					'payload.password', // Potentially logged by v1/login
				],
			},
		);

		await next();

		log.http({
			status: c.res.status,
			responseTime: Date.now() - startTime,
		});
	};

type NodeLoggerOptions = {
	censor?: (url: string) => string;
};

/**
 * Logs each request the express or connect handlers after it answer, with the same fields as `loggerMiddleware`.
 * The body is not logged, since the handlers still have to read it from the stream.
 */
export const nodeLoggerMiddleware =
	(logger: Logger, { censor = (url) => url }: NodeLoggerOptions = {}) =>
	(req: IncomingMessage & { originalUrl?: string }, res: ServerResponse, next: () => void): void => {
		const startTime = Date.now();

		const log = logger.logger.child({
			method: req.method,
			// Hono resolves the REST routes' paths against this base, so logged URLs match theirs
			url: censor(censorUrl(`http://localhost${req.originalUrl ?? req.url}`)),
			userId: req.headers['x-user-id'],
			userAgent: req.headers['user-agent'],
			length: req.headers['content-length'],
			host: req.headers.host,
			referer: req.headers.referer && censor(censorUrl(req.headers.referer)),
			remoteIP: getRemoteAddress(req),
		});

		let logged = false;
		const logResponse = () => {
			if (logged) {
				return;
			}
			logged = true;
			log.http({
				// a client that leaves before the headers go out received no status at all
				status: res.headersSent ? res.statusCode : undefined,
				responseTime: Date.now() - startTime,
				...(!res.writableFinished && { aborted: true }),
			});
		};
		res.once('finish', logResponse);
		res.once('close', logResponse);

		next();
	};

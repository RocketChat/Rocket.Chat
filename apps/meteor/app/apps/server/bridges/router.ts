import { Logger } from '@rocket.chat/logger';
import { tracerSpan } from '@rocket.chat/tracing';
import bodyParser from 'body-parser';
import express from 'express';

import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';

const logger = new Logger('Apps-API');

export const apiServer = express();

apiServer.disable('x-powered-by');

// Parity: this is based on express, middlewares are created for Hono.
// At some point, we need to use Hono here too.
apiServer.use((req, res, next) => {
	const startTime = Date.now();

	const log = logger.logger.child(
		{
			method: req.method,
			url: req.originalUrl || req.url,
			userId: req.header('x-user-id'),
			userAgent: req.header('user-agent'),
			length: req.header('content-length'),
			host: req.header('host'),
			referer: req.header('referer'),
			remoteIP: req.ip,
		},
		{
			redact: ['payload.password'],
		},
	);

	res.on('finish', () => {
		log.http({
			status: res.statusCode,
			responseTime: Date.now() - startTime,
		});
	});

	next();
});

apiServer.use((req, res, next) => {
	const rocketchatRestApiEnd = metrics.rocketchatRestApi.startTimer();

	res.on('finish', () => {
		const entrypoint = (req.baseUrl || req.originalUrl || req.url || '').replace(/^\/api\/apps\//, '');
		rocketchatRestApiEnd({
			status: res.statusCode,
			method: req.method.toLowerCase(),
			version: 'apps',
			...(settings.get('Prometheus_API_User_Agent') && { user_agent: req.header('user-agent') }),
			entrypoint,
		});
	});

	next();
});

apiServer.use((req, res, next) => {
	return tracerSpan(
		`${req.method} ${req.originalUrl || req.url}`,
		{
			attributes: {
				url: req.originalUrl || req.url,
				method: req.method,
				userId: (req as any).userId,
			},
		},
		async (span) => {
			if (span) {
				res.setHeader('X-Trace-Id', span.spanContext().traceId);
			}

			res.on('finish', () => {
				span?.setAttribute('status', res.statusCode);
			});

			next();
		},
	);
});

apiServer.use('/api/apps/private/:appId/:hash', bodyParser.urlencoded(), bodyParser.json());
apiServer.use('/api/apps/public/:appId', bodyParser.urlencoded(), bodyParser.json());

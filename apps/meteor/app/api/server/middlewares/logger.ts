import type { Logger } from '@rocket.chat/logger';
import type { Request, Response, NextFunction } from 'express';

import { getRestPayload } from '../../../../server/lib/logger/logPayloads';

export const loggerMiddleware = (logger: Logger) => async (req: Request, res: Response, next: NextFunction) => {
	const startTime = Date.now();

	const log = logger.logger.child({
		method: req.method,
		url: req.url,
		userId: req.headers['x-user-id'],
		userAgent: req.headers['user-agent'],
		length: req.headers['content-length'],
		host: req.headers.host,
		referer: req.headers.referer,
		remoteIP: req.ip,
		...getRestPayload(req.body),
	});
	res.once('finish', () => {
		log.http({
			status: res.statusCode,
			responseTime: Date.now() - startTime,
		});
	});

	next();
};

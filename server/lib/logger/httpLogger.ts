import type { IncomingMessage, ServerResponse } from 'http';

import type { P } from 'pino';

import type { Logger } from '.';

type IncomingMessageLoggable = IncomingMessage & {
	log: P.Logger;
};

type ServerResponseLoggable = ServerResponse & {
	log: P.Logger;
	startTime: number;
};

function logRequest(this: ServerResponseLoggable, err?: Error): void {
	this.removeListener('finish', logRequest);
	this.removeListener('close', logRequest);
	this.removeListener('error', logRequest);

	const responseTime = Date.now() - this.startTime;

	const { log } = this;

	if (err || this.statusCode >= 500) {
		const error = err || new Error(`failed with status code ${ this.statusCode }`);

		log.http({
			err: error,
			responseTime,
		});
		return;
	}

	log.http({
		responseTime,
		status: this.statusCode,
		instanceId: this.getHeader('x-instance-id'),
	});
}

export function httpLogger(logger: Logger, getRequestIP: Function): (req: IncomingMessageLoggable, res: ServerResponseLoggable, next: Function) => void {
	return (req: IncomingMessageLoggable, res: ServerResponseLoggable, next: Function): void => {
		if (!req.url?.startsWith('/api/')) {
			return next();
		}

		const log = logger.logger.child({
			method: req.method,
			url: req.url,
			userId: req.headers['x-user-id'],
			userAgent: req.headers['user-agent'],
			length: req.headers['content-length'],
			host: req.headers.host,
			referer: req.headers.referer,
			remoteIP: getRequestIP(req),
		});

		req.log = log;
		res.log = log;

		res.startTime = res.startTime || Date.now();

		res.on('finish', logRequest);
		res.on('close', logRequest);
		res.on('error', logRequest);

		next();
	};
}

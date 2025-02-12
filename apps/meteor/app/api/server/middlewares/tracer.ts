import { tracerSpan } from '@rocket.chat/tracing';
import type { Request, Response, NextFunction } from 'express';

export const tracerSpanMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	try {
		await tracerSpan(
			`${req.method} ${req.url}`,
			{
				attributes: {
					url: req.url,
					route: req.route?.path,
					method: req.method,
					userId: req.userId, // Assuming userId is attached to the request object
				},
			},
			async (span) => {
				if (span) {
					res.setHeader('X-Trace-Id', span.spanContext().traceId);
				}

				next();

				await new Promise((resolve) => {
					res.once('finish', resolve);
				});
				span?.setAttribute('status', res.statusCode);
			},
		);
	} catch (error) {
		next(error);
	}
};

import type { Request, Response, NextFunction } from 'express';
import type { Summary } from 'prom-client';

import type { CachedSettings } from '../../../settings/server/CachedSettings';
import type { APIClass } from '../api';

export const metricsMiddleware =
	(api: APIClass, settings: CachedSettings, summary: Summary) => async (req: Request, res: Response, next: NextFunction) => {
		const { method, path } = req;

		const rocketchatRestApiEnd = summary.startTimer({
			method,
			version: api.version,
			...(settings.get('Prometheus_API_User_Agent') && { user_agent: req.headers['user-agent'] }),
			entrypoint: path.startsWith('method.call') ? decodeURIComponent(req.url.slice(8)) : path,
		});

		res.once('finish', () => {
			rocketchatRestApiEnd({
				status: res.statusCode,
			});
		});
		next();
	};

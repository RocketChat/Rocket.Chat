import type { Request, Response, NextFunction } from 'express';
import type { Summary } from 'prom-client';

import type { CachedSettings } from '../../../settings/server/CachedSettings';
import type { APIClass } from '../api';

export const metricsMiddleware = ({
	basePathRegex,
	api,
	settings,
	summary,
}: {
	basePathRegex?: RegExp;
	api: APIClass;
	settings: CachedSettings;
	summary: Summary;
}) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const rocketchatRestApiEnd = summary.startTimer();

		res.once('finish', () => {
			const { method, path, route } = req;

			const routePath = route?.path || path;

			// get rid of the base path (i.e.: /api/v1/)
			const entrypoint = basePathRegex ? routePath.replace(basePathRegex, '') : routePath;

			rocketchatRestApiEnd({
				status: res.statusCode,
				method: method.toLowerCase(),
				version: api.version,
				...(settings.get('Prometheus_API_User_Agent') && { user_agent: req.headers['user-agent'] }),
				entrypoint:
					basePathRegex && entrypoint.startsWith('method.call') ? decodeURIComponent(path.replace(basePathRegex, '')) : entrypoint,
			});
		});
		next();
	};
};

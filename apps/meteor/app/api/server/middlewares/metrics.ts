import type { MiddlewareHandler } from 'hono';
import type { Summary } from 'prom-client';

import type { CachedSettings } from '../../../settings/server/CachedSettings';
import type { APIClass } from '../api';

export const metricsMiddleware =
	(api: APIClass, settings: CachedSettings, summary: Summary): MiddlewareHandler =>
	async (c, next) => {
		const rocketchatRestApiEnd = summary.startTimer();

		await next();

		const { method, path, routePath } = c.req;

		// get rid of the base path (i.e.: /api/v1/)
		const entrypoint = routePath.slice(8);

		rocketchatRestApiEnd({
			status: c.res.status,
			method: method.toLowerCase(),
			version: api.version,
			...(settings.get('Prometheus_API_User_Agent') && { user_agent: c.req.header('user-agent') }),
			entrypoint: entrypoint.startsWith('method.call') ? decodeURIComponent(path.slice(8)) : entrypoint,
		});
	};

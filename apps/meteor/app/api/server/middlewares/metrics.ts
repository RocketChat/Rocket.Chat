import type { MiddlewareHandler } from 'hono';
import type { Summary } from 'prom-client';

import type { CachedSettings } from '../../../settings/server/CachedSettings';
import type { APIClass } from '../api';

export const metricsMiddleware =
	(api: APIClass, settings: CachedSettings, summary: Summary): MiddlewareHandler =>
	async (c, next) => {
		const { method, path } = c.req;

		const rocketchatRestApiEnd = summary.startTimer({
			method,
			version: api.version,
			...(settings.get('Prometheus_API_User_Agent') && { user_agent: c.req.header('user-agent') }),
			entrypoint: path.startsWith('method.call') ? decodeURIComponent(c.req.url.slice(8)) : path,
		});

		await next();
		rocketchatRestApiEnd({
			status: c.res.status,
		});
	};

import type { MiddlewareHandler } from 'hono';
import type { Gauge, Histogram, Summary } from 'prom-client';

import type { CachedSettings } from '../../../settings/server/CachedSettings';
import type { APIClass } from '../ApiClass';

export const metricsMiddleware =
	({
		basePathRegex,
		api,
		settings,
		endpointTimeSummary,
		endpointTimeHistogram,
		responseSizeHistogram,
		activeRequestsGauge,
	}: {
		basePathRegex?: RegExp;
		api: APIClass;
		settings: CachedSettings;
		endpointTimeSummary: Summary;
		endpointTimeHistogram: Histogram;
		responseSizeHistogram: Histogram;
		activeRequestsGauge: Gauge;
	}): MiddlewareHandler =>
	async (c, next) => {
		const rocketchatRestApiEnd = endpointTimeSummary.startTimer();
		const rocketchatRestApiHistEnd = endpointTimeHistogram.startTimer();

		const methodLabel = { method: c.req.method.toLowerCase() };
		activeRequestsGauge.inc(methodLabel);

		await next();

		activeRequestsGauge.dec(methodLabel);

		const { method, path, routePath } = c.req;

		// get rid of the base path (i.e.: /api/v1/)
		const entrypoint = basePathRegex ? routePath.replace(basePathRegex, '') : routePath;

		const histogramLabels = {
			status: c.res.status,
			method: method.toLowerCase(),
			entrypoint: basePathRegex && entrypoint.startsWith('method.call') ? decodeURIComponent(path.replace(basePathRegex, '')) : entrypoint,
		};

		rocketchatRestApiEnd({
			...histogramLabels,
			version: api.version,
			...(settings.get('Prometheus_API_User_Agent') && { user_agent: c.req.header('user-agent') }),
		});
		rocketchatRestApiHistEnd(histogramLabels);

		const contentLength = parseInt(c.res.headers.get('content-length') || '0', 10);
		if (contentLength > 0) {
			responseSizeHistogram.observe(histogramLabels, contentLength);
		}
	};

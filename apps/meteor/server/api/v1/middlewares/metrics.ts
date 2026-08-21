import type { MiddlewareHandler } from 'hono';
import type { Gauge, Histogram, Summary } from 'prom-client';

import type { CachedSettings } from '../../../settings/CachedSettings';

export const metricsMiddleware =
	({
		basePathRegex,
		excludePathRegex,
		api,
		settings,
		endpointTimeSummary,
		endpointTimeHistogram,
		responseSizeHistogram,
		activeRequestsGauge,
	}: {
		basePathRegex?: RegExp;
		excludePathRegex?: RegExp;
		api: { version?: string };
		settings: CachedSettings;
		endpointTimeSummary: Summary;
		endpointTimeHistogram: Histogram;
		responseSizeHistogram: Histogram;
		activeRequestsGauge: Gauge;
	}): MiddlewareHandler =>
	async (c, next) => {
		// Several metrics middlewares share the same `/api` mount (v1, experimental, apps, default), so
		// each one has to ignore the paths that belong to the others or a request gets sampled more than
		// once. The versioned ones opt in by prefix; the catch-all opts out of the prefixes it does not own.
		if (basePathRegex && !basePathRegex.test(c.req.path)) {
			return next();
		}

		if (excludePathRegex?.test(c.req.path)) {
			return next();
		}

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
			version: api.version,
			entrypoint: basePathRegex && entrypoint.startsWith('method.call') ? decodeURIComponent(path.replace(basePathRegex, '')) : entrypoint,
		};

		rocketchatRestApiEnd({
			...histogramLabels,
			...(settings.get('Prometheus_API_User_Agent') && { user_agent: c.req.header('user-agent') }),
		});

		rocketchatRestApiHistEnd(histogramLabels);

		const contentLength = parseInt(c.res.headers.get('content-length') || '0', 10);
		if (contentLength > 0) {
			responseSizeHistogram.observe(histogramLabels, contentLength);
		}
	};

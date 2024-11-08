import { performance } from 'perf_hooks';

import type { NextFunction, Request, Response } from 'express';
import type { ExpressMiddlewareInterface } from 'routing-controllers';
import { Middleware } from 'routing-controllers';

import {
	injectable,
	inject,
	SEMATTRS_HTTP_BODY,
	SEMATTRS_HTTP_QUERY_PARAMS,
	SEMATTRS_HTTP_USER_AGENT,
	SEMATTRS_HTTP_URL,
	SEMATTRS_HTTP_STATUS_CODE,
	SEMATTRS_HTTP_METHOD,
	SEMATTRS_HTTP_COOKIES,
	SEMATTRS_HTTP_HEADERS,
	SEMATTRS_HTTP_CLIENT_IP,
	FUEL_DI_TOKENS,
} from '../../../../internals';
import type { ITracingSpan, IMetrics, ITracing, ILogger } from '../../../../internals';

@injectable()
@Middleware({ type: 'before' })
export class TelemetryMiddleware implements ExpressMiddlewareInterface {
	constructor(
		@inject(FUEL_DI_TOKENS.TRACING) private tracing: ITracing,
		@inject(FUEL_DI_TOKENS.METRICS) private metrics: IMetrics,
		@inject(FUEL_DI_TOKENS.LOGGER) private logger: ILogger,
	) {}

	use(request: Request, response: Response, next: NextFunction): void {
		if (!request.url.includes('/api/')) {
			return next();
		}
		const tracer = this.tracing.createTrace('Express Adapter Tracing');
		const metrics = this.metrics.createMetric('Express Adapter Metric');
		const latencyHistogram = metrics.createHistogram({
			name: 'Express_Latency',
			description: 'Metric to describe each express request latency',
		});

		void tracer.startNewSpanAndKeepSpanOpen(`ExpressAdapter-request`, async (span: ITracingSpan) => {
			span.setAttribute(SEMATTRS_HTTP_METHOD, request.method.toUpperCase());
			span.setAttribute(SEMATTRS_HTTP_URL, request.url);
			span.setAttribute(SEMATTRS_HTTP_COOKIES, JSON.stringify(request.cookies || {}));
			span.setAttribute(SEMATTRS_HTTP_BODY, JSON.stringify(request.body || {}));
			span.setAttribute(SEMATTRS_HTTP_HEADERS, JSON.stringify(request.headers || {}));
			span.setAttribute(SEMATTRS_HTTP_QUERY_PARAMS, JSON.stringify(request.params || {}));
			span.setAttribute(SEMATTRS_HTTP_USER_AGENT, request.headers['user-agent'] || '');
			span.setAttribute(SEMATTRS_HTTP_CLIENT_IP, request.ip);
			span.addEvent('Starting handling request');
			const startTime = performance.now();

			response.on('finish', () => {
				span.setAttribute(SEMATTRS_HTTP_STATUS_CODE, String(response.statusCode));
				const duration = performance.now() - startTime;
				latencyHistogram.record({ value: duration, attributes: { url: request.url } });
				this.logger.info(`Express API Adapter middleware finishing request with status: ${String(response.statusCode)}}` )
				span.addEvent('Finishing handling request');
				span.end();
			});

			return next();
		});
	}
}

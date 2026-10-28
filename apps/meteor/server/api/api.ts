import type { IRoom } from '@rocket.chat/core-typings';
import type { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import type express from 'express';
import { WebApp } from 'meteor/webapp';

import { APIClass } from './ApiClass';
import type { RateLimiterOptions } from './definition';
import { type APIActionHandler, RocketChatAPIRouter } from './router';
import { metrics } from '../lib/metrics';
import { settings } from '../settings';
import { cors } from './v1/middlewares/cors';
import { experimentalWarningMiddleware } from './v1/middlewares/experimental';
import { loggerMiddleware } from './v1/middlewares/logger';
import { metricsMiddleware } from './v1/middlewares/metrics';
import { remoteAddressMiddleware } from './v1/middlewares/remoteAddressMiddleware';
import { tracerSpanMiddleware } from './v1/middlewares/tracer';

const logger = new Logger('API');

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & unknown;

export type { RateLimiterOptions } from './definition';

export const defaultRateLimiterOptions: RateLimiterOptions = {
	numRequestsAllowed: settings.get<number>('API_Enable_Rate_Limiter_Limit_Calls_Default'),
	intervalTimeInMS: settings.get<number>('API_Enable_Rate_Limiter_Limit_Time_Default'),
};

const createApi = function _createApi(options: { version?: string; useDefaultAuth?: true } = {}): APIClass {
	return new APIClass({
		apiPath: '',
		useDefaultAuth: false,
		prettyJson: process.env.NODE_ENV === 'development',
		...options,
	});
};

export const API: {
	api: Router<'/api', any, APIActionHandler>;
	v1: APIClass<'/v1'>;
	experimental: APIClass<'/experimental'>;
	default: APIClass;
	ApiClass: typeof APIClass;
	channels?: {
		create: {
			validate: (params: {
				user: { value: string };
				name?: { key: string; value?: string };
				members?: { key: string; value?: string[] };
				customFields?: { key: string; value?: string };
				teams?: { key: string; value?: string[] };
				teamId?: { key: string; value?: string };
			}) => Promise<void>;
			execute: (
				userId: string,
				params: {
					name?: string;
					members?: string[];
					customFields?: Record<string, any>;
					extraData?: Record<string, any>;
					readOnly?: boolean;
				},
			) => Promise<{ channel: IRoom }>;
		};
	};
} = {
	ApiClass: APIClass,
	api: new RocketChatAPIRouter('/api'),
	v1: createApi({
		version: 'v1',
		useDefaultAuth: true,
	}),
	experimental: createApi({
		version: 'experimental',
		useDefaultAuth: true,
	}),
	default: createApi({}),
};

settings.watch<string>('Accounts_CustomFields', (value) => {
	if (!value) {
		return API.v1?.setLimitedCustomFields([]);
	}
	try {
		const customFields = JSON.parse(value);
		const nonPublicCustomFields = Object.keys(customFields).filter((customFieldKey) => customFields[customFieldKey].public !== true);
		API.v1.setLimitedCustomFields(nonPublicCustomFields);
	} catch (error) {
		console.warn('Invalid Custom Fields', error);
	}
});

const reloadRoutesToRefreshRateLimiter = () => {
	API.v1.reloadRoutesToRefreshRateLimiter();
	API.experimental.reloadRoutesToRefreshRateLimiter();
};

settings.watch<number>('API_Enable_Rate_Limiter_Limit_Time_Default', (value) => {
	defaultRateLimiterOptions.intervalTimeInMS = value;
	reloadRoutesToRefreshRateLimiter();
});

settings.watch<number>('API_Enable_Rate_Limiter_Limit_Calls_Default', (value) => {
	defaultRateLimiterOptions.numRequestsAllowed = value;
	reloadRoutesToRefreshRateLimiter();
});

export const startRestAPI = () => {
	(WebApp.rawConnectHandlers as unknown as ReturnType<typeof express>).use(
		API.api
			.use(
				metricsMiddleware({
					basePathRegex: new RegExp(/^\/api\/v1\//),
					api: API.v1,
					settings,
					endpointTimeSummary: metrics.rocketchatRestApi,
					endpointTimeHistogram: metrics.rocketchatRestApiSeconds,
					responseSizeHistogram: metrics.rocketchatRestApiResponseSizeBytes,
					activeRequestsGauge: metrics.rocketchatRestApiActiveRequests,
				}),
			)
			.use(
				metricsMiddleware({
					basePathRegex: new RegExp(/^\/api\/experimental\//),
					api: API.experimental,
					settings,
					endpointTimeSummary: metrics.rocketchatRestApi,
					endpointTimeHistogram: metrics.rocketchatRestApiSeconds,
					responseSizeHistogram: metrics.rocketchatRestApiResponseSizeBytes,
					activeRequestsGauge: metrics.rocketchatRestApiActiveRequests,
				}),
			)
			.use(
				// Catch-all sampler for the default router (`/api/info`, `/api/docs/json`) and for
				// unmatched `/api/*` paths, which belong to none of the versioned prefixes above.
				// Add any new versioned namespace to `excludePathRegex` as well, or it gets counted twice.
				metricsMiddleware({
					excludePathRegex: new RegExp(/^\/api\/(v1|experimental|apps)\//),
					// `API.default` has no `version`; label it explicitly so the series is not blank.
					api: { version: 'default' },
					settings,
					endpointTimeSummary: metrics.rocketchatRestApi,
					endpointTimeHistogram: metrics.rocketchatRestApiSeconds,
					responseSizeHistogram: metrics.rocketchatRestApiResponseSizeBytes,
					activeRequestsGauge: metrics.rocketchatRestApiActiveRequests,
				}),
			)
			.use(tracerSpanMiddleware)
			.use(remoteAddressMiddleware)
			.use(experimentalWarningMiddleware({ basePathRegex: new RegExp(/^\/api\/experimental(\/|$)/) }))
			.use(cors(settings))
			.use(loggerMiddleware(logger))
			.use(API.v1.router)
			.use(API.experimental.router)
			.use(API.default.router).router,
	);
};

export type ExtractApiClassEndpoints<TApi extends APIClass<any>> =
	TApi extends APIClass<any, infer TOperations> ? (TOperations extends { method: string } ? Prettify<TOperations> : never) : never;

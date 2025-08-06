import type { IRoom } from '@rocket.chat/core-typings';
import type { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';

import type express from 'express';
import { WebApp } from 'meteor/webapp';

import { APIClass } from './ApiClass';
import { cors } from './middlewares/cors';
import { loggerMiddleware } from './middlewares/logger';
import { metricsMiddleware } from './middlewares/metrics';
import { remoteAddressMiddleware } from './middlewares/remoteAddressMiddleware';
import { tracerSpanMiddleware } from './middlewares/tracer';
import { type APIActionHandler, RocketChatAPIRouter } from './router';
import { metrics } from '../../metrics/server';
import { settings } from '../../settings/server';

const logger = new Logger('API');

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & unknown;

export type RateLimiterOptions = {
	numRequestsAllowed?: number;
	intervalTimeInMS?: number;
};

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

settings.watch<number>('API_Enable_Rate_Limiter_Limit_Time_Default', (value) => {
	defaultRateLimiterOptions.intervalTimeInMS = value;
	API.v1.reloadRoutesToRefreshRateLimiter();
});

settings.watch<number>('API_Enable_Rate_Limiter_Limit_Calls_Default', (value) => {
	defaultRateLimiterOptions.numRequestsAllowed = value;
	API.v1.reloadRoutesToRefreshRateLimiter();
});

export const startRestAPI = () => {
	(WebApp.rawConnectHandlers as unknown as ReturnType<typeof express>).use(
		API.api
			.use(remoteAddressMiddleware)
			.use(cors(settings))
			.use(loggerMiddleware(logger))
			.use(metricsMiddleware({ basePathRegex: new RegExp(/^\/api\/v1\//), api: API.v1, settings, summary: metrics.rocketchatRestApi }))
			.use(tracerSpanMiddleware)
			.use(API.v1.router)
			.use(API.default.router).router,
	);
};

export type ExtractApiClassEndpoints<TApi extends APIClass<any>> =
	TApi extends APIClass<any, infer TOperations> ? (TOperations extends { method: string } ? Prettify<TOperations> : never) : never;

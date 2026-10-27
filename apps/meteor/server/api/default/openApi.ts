import { schemas } from '@rocket.chat/core-typings';
import type { Route } from '@rocket.chat/http-router';
import { getSharedSchemas, openAPIErrorComponents, withOperationIds } from '@rocket.chat/http-router';
import { ajv, isOpenAPIJSONEndpoint } from '@rocket.chat/rest-typings';
import express from 'express';
import { WebApp } from 'meteor/webapp';
import swaggerUi from 'swagger-ui-express';

import { settings } from '../../settings';
import { API } from '../api';
import type { SuccessResult } from '../definition';
import { getTrimmedServerVersion } from '../lib/getTrimmedServerVersion';

const app = express();

const getTypedRoutes = (
	typedRoutes: Record<string, Record<string, Route>>,
	{ withUndocumented = false }: { withUndocumented?: boolean } = {},
): Record<string, Record<string, Route>> => {
	if (withUndocumented) {
		return typedRoutes;
	}

	return Object.entries(typedRoutes).reduce(
		(acc, [path, methods]) => {
			const filteredMethods = Object.entries(methods)
				.filter(([_, options]) => !options?.tags?.includes('Missing Documentation'))
				.reduce(
					(acc, [method, options]) => {
						acc[method] = options;
						return acc;
					},
					{} as Record<string, Route>,
				);

			if (Object.keys(filteredMethods).length > 0) {
				acc[path] = filteredMethods;
			}

			return acc;
		},
		{} as Record<string, Record<string, Route>>,
	);
};

const TAG_DESCRIPTIONS: Record<string, string> = {
	'Missing Documentation': 'Endpoints that are not typed yet; their request and response shapes are not described.',
};

const getTags = (paths: Record<string, Record<string, Route>>) => {
	const names = new Set(
		Object.values(paths)
			.flatMap((methods) => Object.values(methods))
			.flatMap((route) => route.tags ?? []),
	);

	return [...names].sort().map((name) => ({
		name,
		...(TAG_DESCRIPTIONS[name] && { description: TAG_DESCRIPTIONS[name] }),
	}));
};

const siteUrl = () => settings.get<string>('Site_Url')?.replace(/\/$/, '');

const makeOpenAPIResponse = (paths: Record<string, Record<string, Route>>) => ({
	openapi: '3.1.0',
	info: {
		title: 'Rocket.Chat API',
		description:
			'REST API of this Rocket.Chat workspace. Authenticate by sending the `X-User-Id` and `X-Auth-Token` headers obtained from `/api/v1/login`.',
		version: getTrimmedServerVersion(),
	},
	externalDocs: {
		url: 'https://developer.rocket.chat/apidocs',
		description: 'Rocket.Chat developer documentation',
	},
	// trailing slash would make every path in the document resolve with a double one, and a Server
	// Object without a url is invalid, so an unset `Site_Url` means no `servers` at all
	...(siteUrl() && { servers: [{ url: siteUrl() }] }),
	tags: getTags(paths),
	paths: withOperationIds(paths),
	components: {
		securitySchemes: {
			userId: {
				type: 'apiKey',
				in: 'header',
				name: 'X-User-Id',
			},
			authToken: {
				type: 'apiKey',
				in: 'header',
				name: 'X-Auth-Token',
			},
		},
		schemas: {
			...schemas.components.schemas,
			...openAPIErrorComponents,
			...getSharedSchemas(),
		},
	},
});

const openApiResponseSchema = ajv.compile<Record<string, unknown>>({
	type: 'object',
	properties: {
		openapi: { type: 'string' },
		info: { type: 'object' },
		externalDocs: { type: 'object' },
		servers: { type: 'array', items: {} },
		tags: { type: 'array', items: {} },
		components: { type: 'object' },
		paths: { type: 'object' },
	},
	required: ['openapi', 'info', 'paths'],
	additionalProperties: false,
});

API.default.get(
	'docs/json',
	{
		authRequired: false,
		query: isOpenAPIJSONEndpoint,
		response: {
			200: openApiResponseSchema,
		},
	},
	function action() {
		const { withUndocumented = false } = this.queryParams;

		// The document is served as it is: `API.default.success` would add a `success` key to its root,
		// which is not an OpenAPI field and fails validation. The cast is the price of saying so - every
		// 2xx body is typed as `{ success: true } & T`, and this one is the exception.
		return {
			statusCode: 200 as const,
			body: makeOpenAPIResponse(getTypedRoutes(API.api.typedRoutes, { withUndocumented })),
		} as unknown as SuccessResult<Record<string, unknown>>;
	},
);

app.use(
	'/api-docs',
	swaggerUi.serve,
	swaggerUi.setup(null, {
		swaggerOptions: {
			// Relative to `/api-docs`, not to the root: this runs at import time, before settings are
			// loaded, so `Site_Url` would render as "undefined", and a leading slash would drop the
			// deployment prefix of a workspace hosted under ROOT_URL_PATH_PREFIX.
			url: '../api/docs/json',
		},
	}),
);
WebApp.connectHandlers.use(app);

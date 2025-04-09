import { isOpenAPIJSONEndpoint } from '@rocket.chat/rest-typings';
import express from 'express';
import { WebApp } from 'meteor/webapp';
import swaggerUi from 'swagger-ui-express';

import { settings } from '../../../settings/server';
import { Info } from '../../../utils/rocketchat.info';
import { API } from '../api';
import type { Route } from '../router';

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

const makeOpenAPIResponse = (paths: Record<string, Record<string, Route>>) => ({
	openapi: '3.0.3',
	info: {
		title: 'Rocket.Chat API',
		description: 'Rocket.Chat API',
		version: Info.version,
	},
	servers: [
		{
			url: settings.get('Site_Url'),
		},
	],
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
		schemas: {},
	},
	paths,
});

API.default.addRoute(
	'docs/json',
	{ authRequired: false, validateParams: isOpenAPIJSONEndpoint },
	{
		get() {
			const { withUndocumented = false } = this.queryParams;

			return API.default.success(makeOpenAPIResponse(getTypedRoutes(API.api.typedRoutes, { withUndocumented })));
		},
	},
);

app.use(
	'/api-docs',
	swaggerUi.serve,
	swaggerUi.setup(null, {
		swaggerOptions: {
			url: `${settings.get('Site_Url')}/api/docs/json`,
		},
	}),
);
WebApp.connectHandlers.use(app);

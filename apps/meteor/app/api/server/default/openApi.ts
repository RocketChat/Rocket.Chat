import { settings } from '../../../settings/server';
import { Info } from '../../../utils/rocketchat.info';
import { API } from '../api';

API.default.addRoute(
	'/json',
	{ authRequired: false },
	{
		get() {
			return API.default.success({
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
				paths: API.v1.typedRoutes,
			});
		},
	},
);

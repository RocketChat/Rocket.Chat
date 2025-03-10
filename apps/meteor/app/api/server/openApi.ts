import { API } from './api';
import { settings } from '../../settings/server';
import { Info } from '../../utils/rocketchat.info';

const openApi = new API.ApiClass({
	version: 'json',
	useDefaultAuth: false,
	prettyJson: false,
	enableCors: false,
	auth: API.getUserAuth(),
});

openApi.addRoute('/', {
	get() {
		return {
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
		};
	},
});

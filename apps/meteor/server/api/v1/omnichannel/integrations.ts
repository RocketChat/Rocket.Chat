import { API } from '../..';
import { findIntegrationSettings } from './lib/integrations';

API.v1.addRoute(
	'livechat/integrations.settings',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			return API.v1.success(await findIntegrationSettings());
		},
	},
);

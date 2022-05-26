import { API } from '../../../../api/server';
import { findIntegrationSettings } from '../../../server/api/lib/integrations';

API.v1.addRoute(
	'livechat/integrations.settings',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success(
				await findIntegrationSettings({
					userId: this.userId,
				}),
			);
		},
	},
);

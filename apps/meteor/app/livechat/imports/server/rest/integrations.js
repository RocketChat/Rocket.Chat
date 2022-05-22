import { API } from '../../../../api/server';
import { findIntegrationSettings } from '../../../server/api/lib/integrations';

API.v1.addRoute(
	'livechat/integrations.settings',
	{ authRequired: true },
	{
		get() {
			const settings = Promise.await(
				findIntegrationSettings({
					userId: this.userId,
				}),
			);

			return API.v1.success(settings);
		},
	},
);

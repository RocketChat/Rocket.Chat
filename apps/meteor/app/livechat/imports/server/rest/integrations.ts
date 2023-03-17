import { Settings } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { findIntegrationSettings } from '../../../server/api/lib/integrations';

API.v1.addRoute(
	'livechat/integrations.settings',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
			return API.v1.success(await findIntegrationSettings());
		},
	},
);

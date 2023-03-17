import { Settings } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { findAppearance } from '../../../server/api/lib/appearance';

API.v1.addRoute(
	'livechat/appearance',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
			const { appearance } = await findAppearance();

			return API.v1.success({
				appearance,
			});
		},
	},
);

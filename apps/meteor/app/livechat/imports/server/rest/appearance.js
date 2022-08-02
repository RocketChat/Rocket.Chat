import { API } from '../../../../api/server';
import { findAppearance } from '../../../server/api/lib/appearance';

API.v1.addRoute(
	'livechat/appearance',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			const { appearance } = Promise.await(findAppearance());

			return API.v1.success({
				appearance,
			});
		},
	},
);

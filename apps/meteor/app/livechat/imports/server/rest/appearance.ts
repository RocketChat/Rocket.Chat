import { API } from '../../../../api/server';
import { findAppearance } from '../../../server/api/lib/appearance';

API.v1.addRoute(
	'livechat/appearance',
	{ authRequired: true },
	{
		async get() {
			const { appearance } = await findAppearance({ userId: this.userId });

			return API.v1.success({
				appearance,
			});
		},
	},
);

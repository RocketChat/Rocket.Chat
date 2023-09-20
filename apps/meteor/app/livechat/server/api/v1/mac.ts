import { Omnichannel } from '@rocket.chat/core-services';

import { API } from '../../../../api/server';

API.v1.addRoute(
	'omnichannel/mac/check',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success({
				onLimit: await Omnichannel.checkMACLimit(),
			});
		},
	},
);

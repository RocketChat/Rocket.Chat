import { Presence } from '@rocket.chat/core-services';

import { API } from '../api';

API.v1.addRoute(
	'presence.getConnections',
	{ authRequired: true, permissionsRequired: ['manage-user-status'] },
	{
		async get() {
			const result = await Presence.getConnectionCount();

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'presence.enableBroadcast',
	{ authRequired: true, permissionsRequired: ['manage-user-status'], twoFactorRequired: true },
	{
		async post() {
			await Presence.toggleBroadcast(true);

			return API.v1.success();
		},
	},
);

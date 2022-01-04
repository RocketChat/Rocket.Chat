import { API } from '../api';
import { findOAuthApps, findOneAuthApp } from '../lib/oauthApps';

API.v1.addRoute(
	'oauth-apps.list',
	{ authRequired: true },
	{
		get() {
			return API.v1.success({
				oauthApps: Promise.await(findOAuthApps({ uid: this.userId })),
			});
		},
	},
);

API.v1.addRoute(
	'oauth-apps.get',
	{ authRequired: true },
	{
		get() {
			const { clientId, appId } = this.queryParams;
			if (!clientId && !appId) {
				return API.v1.failure('At least one of the query parameters "clientId" or "appId" is required.');
			}

			return API.v1.success({
				oauthApp: Promise.await(findOneAuthApp({ clientId, appId })),
			});
		},
	},
);

import { isOauthAppsGetParams, isOauthAppsAddParams } from '@rocket.chat/rest-typings';
import { OAuthApps } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { API } from '../api';
import { addOAuthApp } from '../../../oauth2-server-config/server/admin/methods/addOAuthApp';

API.v1.addRoute(
	'oauth-apps.list',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'manage-oauth-apps'))) {
				throw new Error('error-not-allowed');
			}

			return API.v1.success({
				oauthApps: await OAuthApps.find().toArray(),
			});
		},
	},
);

API.v1.addRoute(
	'oauth-apps.get',
	{ authRequired: true },
	{
		async get() {
			if (!isOauthAppsGetParams(this.queryParams)) {
				return API.v1.failure('At least one of the query parameters "clientId" or "appId" is required.');
			}

			const oauthApp = await OAuthApps.findOneAuthAppByIdOrClientId(this.queryParams);

			if (!oauthApp) {
				return API.v1.failure('OAuth app not found.');
			}

			return API.v1.success({
				oauthApp,
			});
		},
	},
);

API.v1.addRoute(
	'oauth-apps.create',
	{
		authRequired: true,
		validateParams: isOauthAppsAddParams,
	},
	{
		async post() {
			const application = await addOAuthApp(this.bodyParams, this.userId);

			return API.v1.success({ application });
		},
	},
);

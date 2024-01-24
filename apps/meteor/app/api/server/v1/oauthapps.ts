import { OAuthApps } from '@rocket.chat/models';
import { isUpdateOAuthAppParams, isOauthAppsGetParams, isOauthAppsAddParams, isDeleteOAuthAppParams } from '@rocket.chat/rest-typings';

import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { addOAuthApp } from '../../../oauth2-server-config/server/admin/functions/addOAuthApp';
import { API } from '../api';

API.v1.addRoute(
	'oauth-apps.list',
	{ authRequired: true, permissionsRequired: ['manage-oauth-apps'] },
	{
		async get() {
			return API.v1.success({
				oauthApps: await OAuthApps.find().toArray(),
			});
		},
	},
);

API.v1.addRoute(
	'oauth-apps.get',
	{ authRequired: true, validateParams: isOauthAppsGetParams, permissionsRequired: ['manage-oauth-apps'] },
	{
		async get() {
			const oauthApp = await OAuthApps.findOneAuthAppByIdOrClientId(this.queryParams);

			if (!oauthApp) {
				return API.v1.failure('OAuth app not found.');
			}

			if ('appId' in this.queryParams) {
				apiDeprecationLogger.parameter(this.request.route, 'appId', '7.0.0', this.response);
			}

			return API.v1.success({
				oauthApp,
			});
		},
	},
);

API.v1.addRoute(
	'oauth-apps.update',
	{ authRequired: true, validateParams: isUpdateOAuthAppParams, permissionsRequired: ['manage-oauth-apps'] },
	{
		async post() {
			const { appId } = this.bodyParams;

			const result = await Meteor.callAsync('updateOAuthApp', appId, this.bodyParams);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'oauth-apps.delete',
	{ authRequired: true, validateParams: isDeleteOAuthAppParams, permissionsRequired: ['manage-oauth-apps'] },
	{
		async post() {
			const { appId } = this.bodyParams;

			const result = await Meteor.callAsync('deleteOAuthApp', appId);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'oauth-apps.create',
	{ authRequired: true, validateParams: isOauthAppsAddParams, permissionsRequired: ['manage-oauth-apps'] },
	{
		async post() {
			const application = await addOAuthApp(this.bodyParams, this.userId);

			return API.v1.success({ application });
		},
	},
);

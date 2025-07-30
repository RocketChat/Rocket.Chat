import type { IOAuthApps, IUser } from '@rocket.chat/core-typings';

import type { DeleteOAuthAppParams } from './oauthapps/DeleteOAuthAppParamsDELETE';
import type { OauthAppsGetParams } from './oauthapps/OAuthAppsGetParamsGET';
import type { UpdateOAuthAppParams } from './oauthapps/UpdateOAuthAppParamsPOST';

export type OAuthAppsEndpoint = {
	'/v1/oauth-apps.list': {
		GET: (params: { uid: IUser['_id'] }) => {
			oauthApps: IOAuthApps[];
		};
	};

	'/v1/oauth-apps.get': {
		GET: (params: OauthAppsGetParams) => {
			oauthApp: IOAuthApps;
		};
	};

	'/v1/oauth-apps.update': {
		POST: (params: UpdateOAuthAppParams) => IOAuthApps | null;
	};

	'/v1/oauth-apps.delete': {
		POST: (params: DeleteOAuthAppParams) => boolean;
	};
};
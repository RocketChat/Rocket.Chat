import type { IOAuthApps } from '@rocket.chat/core-typings';

import type { OauthAppsGetParams } from './oauthapps/OAuthAppsGetParamsGET';

export type OAuthAppsEndpoint = {
	'/v1/oauth-apps.get': {
		GET: (params: OauthAppsGetParams) => {
			oauthApp: IOAuthApps;
		};
	};
};

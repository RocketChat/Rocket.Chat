import type { IOAuthApps, IUser } from '@rocket.chat/core-typings';

import type { OauthAppsGetParams, UpdateOAuthAppParams } from '..';

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

	'/v1/oauth-apps.updateOAuthApp': {
		POST: (params: UpdateOAuthAppParams) => IOAuthApps | null;
	};

	'/v1/oauth-apps/:_id': {
		DELETE: () => boolean;
	};
};

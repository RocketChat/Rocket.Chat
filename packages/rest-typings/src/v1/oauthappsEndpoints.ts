import type { IUser } from '@rocket.chat/core-typings';

export type OAuthEndpoints = {
	'oauth-apps.list': {
		GET: (params: { uid: IUser['_id'] }) => {
			oauthApps: unknown[];
		};
	};

	'oauth-apps.get': {
		GET: (params: { clientId: string; appId: string }) => {
			oauthApp: unknown;
		};
	};
};

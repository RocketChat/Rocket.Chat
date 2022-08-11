import type { IUser } from '@rocket.chat/core-typings';

type Keys =
	| 'name'
	| 'username'
	| 'nickname'
	| 'emails'
	| 'status'
	| 'statusDefault'
	| 'statusText'
	| 'statusConnection'
	| 'bio'
	| 'avatarOrigin'
	| 'utcOffset'
	| 'language'
	| 'settings'
	| 'idleTimeLimit'
	| 'roles'
	| 'active'
	| 'defaultRoom'
	| 'customFields'
	| 'requirePasswordChange'
	| 'requirePasswordChangeReason'
	| 'services.github'
	| 'services.gitlab'
	| 'services.tokenpass'
	| 'services.password.bcrypt'
	| 'services.totp.enabled'
	| 'services.email2fa.enabled'
	| 'statusLivechat'
	| 'banners'
	| 'oauth.authorizedClients'
	| '_updatedAt'
	| 'avatarETag'
	| 'extension';

export type MeEndpoints = {
	'/v1/me': {
		GET: (params?: { fields: Record<Keys, 0> | Record<Keys, 1>; user: IUser }) => IUser & {
			email?: string;
			settings: {
				profile: Record<string, unknown>;
				preferences: unknown;
			};
			avatarUrl: string;
		};
	};
};

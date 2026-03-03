import type { IUser } from '@rocket.chat/core-typings';

export type Keys =
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
	| 'services.password.bcrypt'
	| 'services.totp.enabled'
	| 'services.email2fa.enabled'
	| 'statusLivechat'
	| 'banners'
	| 'oauth.authorizedClients'
	| '_updatedAt'
	| 'avatarETag';

export interface IMeResponse extends IUser {
	success: true;
}

export type MeParams = {
	fields?: Partial<Record<Keys, 0 | 1>>;
};

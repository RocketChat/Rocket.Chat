import type { IUser, Serialized } from '@rocket.chat/core-typings';

type RawUserData = Serialized<
	Pick<
		IUser,
		| '_id'
		| 'type'
		| 'name'
		| 'username'
		| 'emails'
		| 'status'
		| 'statusDefault'
		| 'statusText'
		| 'statusConnection'
		| 'avatarOrigin'
		| 'utcOffset'
		| 'language'
		| 'settings'
		| 'roles'
		| 'active'
		| 'defaultRoom'
		| 'customFields'
		| 'statusLivechat'
		| 'oauth'
		| 'createdAt'
		| '_updatedAt'
		| 'avatarETag'
	>
>;

export type MeEndpoints = {
	'/v1/me': {
		GET: () => RawUserData;
	};
};

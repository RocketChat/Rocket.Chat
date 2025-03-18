type UserFields = {
	[k: string]: number;
};

export const getBaseUserFields = (): UserFields => ({
	'name': 1,
	'username': 1,
	'nickname': 1,
	'emails': 1,
	'status': 1,
	'statusDefault': 1,
	'statusText': 1,
	'statusConnection': 1,
	'bio': 1,
	'avatarOrigin': 1,
	'utcOffset': 1,
	'language': 1,
	'settings': 1,
	'enableAutoAway': 1,
	'idleTimeLimit': 1,
	'roles': 1,
	'active': 1,
	'defaultRoom': 1,
	'customFields': 1,
	'requirePasswordChange': 1,
	'requirePasswordChangeReason': 1,
	'statusLivechat': 1,
	'banners': 1,
	'oauth.authorizedClients': 1,
	'_updatedAt': 1,
	'avatarETag': 1,
	'extension': 1,
	'openBusinessHours': 1,
});

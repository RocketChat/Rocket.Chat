// Convenience method, almost need to turn it into a middleware of sorts
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { isTruthy } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';

export async function getUserFromParams<T extends boolean = false>(
	params: {
		userId?: string;
		username?: string;
		user?: string;
	},
	full?: T,
): Promise<
	T extends true
		? IUser
		: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'statusDefault' | 'statusText' | 'statusSource' | 'statusExpiresAt' | 'roles'>
> {
	let user;

	const projection = full
		? {}
		: { username: 1, name: 1, status: 1, statusDefault: 1, statusText: 1, statusSource: 1, statusExpiresAt: 1, roles: 1 };
	if (params.userId?.trim()) {
		user = await Users.findOneById(params.userId, { projection });
	} else if (params.username?.trim()) {
		user = await Users.findOneByUsernameIgnoringCase(params.username, { projection });
	} else if (params.user?.trim()) {
		user = await Users.findOneByUsernameIgnoringCase(params.user, { projection });
	} else {
		throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
	}

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
	}

	return user;
}

export async function getUserListFromParams(params: {
	userId?: string;
	username?: string;
	user?: string;
	userIds?: string[];
	usernames?: string[];
}): Promise<Pick<IUser, '_id' | 'username'>[]> {
	// if params.userId is provided, include it as well
	const soleUser = params.userId || params.username || params.user;
	let userListParam = params.userIds || params.usernames || [];
	userListParam.push(soleUser || '');
	userListParam = userListParam.filter(Boolean);

	// deduplicate to avoid errors
	userListParam = [...new Set(userListParam)];

	if (!userListParam.length) {
		throw new Meteor.Error('error-users-params-not-provided', 'Please provide "userId" or "username" or "userIds" or "usernames" as param');
	}

	if (params.userIds || params.userId) {
		return Users.findByIds(userListParam, { projection: { username: 1 } }).toArray();
	}

	return Users.findByUsernamesIgnoringCase(userListParam, { projection: { username: 1 } }).toArray();
}

/**
 * Resolves a list of usernames from the request params without requiring the users to
 * already exist locally. `username`/`usernames`/`user` are passed through verbatim, while
 * `userId`/`userIds` are resolved to their usernames via the database.
 *
 * Unlike `getUserListFromParams`, this does not drop usernames that have no local record yet
 * — which is what federation invites rely on: the federated user record is created lazily
 * inside `addUsersToRoomMethod`.
 */
export async function getUsernameListFromParams(params: {
	userId?: string;
	username?: string;
	user?: string;
	userIds?: string[];
	usernames?: string[];
}): Promise<string[]> {
	const usernames = [...(params.usernames || []), params.username, params.user].filter(isTruthy);
	const userIds = [...(params.userIds || []), params.userId].filter(isTruthy);

	const usernamesFromIds = userIds.length
		? (await Users.findByIds(userIds, { projection: { username: 1 } }).toArray()).map((u) => u.username).filter(isTruthy)
		: [];

	const all = [...new Set([...usernames, ...usernamesFromIds])];

	if (!all.length) {
		throw new Meteor.Error('error-users-params-not-provided', 'Please provide "userId" or "username" or "userIds" or "usernames" as param');
	}

	return all;
}

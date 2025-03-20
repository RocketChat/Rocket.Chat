// Convenience method, almost need to turn it into a middleware of sorts
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

export async function getUserFromParams(params: {
	userId?: string;
	username?: string;
	user?: string;
}): Promise<Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'statusText' | 'roles'>> {
	let user;

	const projection = { username: 1, name: 1, status: 1, statusText: 1, roles: 1 };
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

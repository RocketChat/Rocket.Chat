// Convenience method, almost need to turn it into a middleware of sorts
import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';
import { Users as UsersRaw } from '@rocket.chat/models';

import { Users } from '../../../models/server';
import { API } from '../api';

export async function getUserFromParams(params: {
	userId?: string;
	username?: string;
	user?: string;
}): Promise<Pick<IUser, '_id' | 'username' | 'name' | 'status'>> {
	let user;

	if (params.userId?.trim()) {
		user = await UsersRaw.findOneById(params.userId);
	} else if (params.username?.trim()) {
		user = await UsersRaw.findOneByUsernameIgnoringCase(params.username, { projection: { username: 1, name: 1, status: 1 } });
	} else if (params.user?.trim()) {
		user = await UsersRaw.findOneByUsernameIgnoringCase(params.user, { projection: { username: 1, name: 1, status: 1 } });
	} else {
		throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
	}

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
	}

	return user;
}

API.helperMethods.set('getUserFromParams', function _getUserFromParams(this: any) {
	const doesntExist = { _doesntExist: true };
	let user;
	const params = this.requestParams();

	if (params.userId?.trim()) {
		user = Users.findOneById(params.userId) || doesntExist;
	} else if (params.username?.trim()) {
		user = Users.findOneByUsernameIgnoringCase(params.username) || doesntExist;
	} else if (params.user?.trim()) {
		user = Users.findOneByUsernameIgnoringCase(params.user) || doesntExist;
	} else {
		throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
	}

	if (user._doesntExist) {
		throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
	}

	return user;
});

export async function getUserListFromParams(params: {
	userId?: string;
	username?: string;
	user?: string;
	userIds?: string[];
	usernames?: string[];
}): Promise<Pick<IUser, '_id' | 'username'>[]> {
	let users;
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
		users = await Users.findByIds(userListParam, { fields: { username: 1 } });
	} else {
		users = await Users.findByUsernamesIgnoringCase(userListParam, { fields: { username: 1 } });
	}

	return users.fetch();
}

API.helperMethods.set('getUserListFromParams', function _getUserListFromParams(this: any) {
	let users;
	const params = this.requestParams();
	// if params.userId is provided, include it as well
	const soleUser = params.userId || params.username || params.user;
	let userListParam = params.userIds || params.usernames || [];
	userListParam.push(soleUser);
	userListParam = userListParam.filter(Boolean);

	// deduplicate to avoid errors
	userListParam = [...new Set(userListParam)];

	if (!userListParam.length) {
		throw new Meteor.Error('error-users-params-not-provided', 'Please provide "userId" or "username" or "userIds" or "usernames" as param');
	}

	if (params.userIds || params.userId) {
		users = Users.findByIds(userListParam);
	} else {
		users = Users.findByUsernamesIgnoringCase(userListParam);
	}

	return users.fetch();
});

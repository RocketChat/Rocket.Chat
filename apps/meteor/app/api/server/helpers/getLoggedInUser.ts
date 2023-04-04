import { Accounts } from 'meteor/accounts-base';
import { Users as UsersRaw } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { Users } from '../../../models/server';
import { API } from '../api';

export async function getLoggedInUser(token: string, userId: string): Promise<Pick<IUser, '_id' | 'username'> | null> {
	if (!token || !userId) {
		return null;
	}
	return UsersRaw.findOne(
		{
			'_id': userId,
			'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token),
		},
		{ projection: { username: 1 } },
	);
}

API.helperMethods.set('getLoggedInUser', function _getLoggedInUser(this: any) {
	if (this.request.headers['x-auth-token'] && this.request.headers['x-user-id']) {
		return Users.findOne({
			'_id': this.request.headers['x-user-id'],
			'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(this.request.headers['x-auth-token']),
		});
	}
});

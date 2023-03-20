import { Accounts } from 'meteor/accounts-base';
import { Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

export async function getLoggedInUser(token: string, userId: string): Promise<Pick<IUser, '_id' | 'username'> | null> {
	if (!token || !userId) {
		return null;
	}
	return Users.findOne(
		{
			'_id': userId,
			'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token),
		},
		{ projection: { username: 1 } },
	);
}

import { Accounts } from 'meteor/accounts-base';
import { Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';
import type { Request } from 'express';

export async function getLoggedInUser(request: Request): Promise<Pick<IUser, '_id' | 'username'> | null> {
	const token = request.headers['x-auth-token'];
	const userId = request.headers['x-user-id'];
	if (!token || !userId) {
		return null;
	}

	return Users.findOneByIdAndLoginToken(userId as string, Accounts._hashLoginToken(token as string), { projection: { username: 1 } });
}

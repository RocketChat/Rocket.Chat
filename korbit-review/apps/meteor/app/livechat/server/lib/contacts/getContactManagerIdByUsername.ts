import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

export async function getContactManagerIdByUsername(
	username: Required<IUser>['username'],
	session?: ClientSession,
): Promise<IUser['_id'] | undefined> {
	const user = await Users.findOneByUsername<Pick<IUser, '_id'>>(username, { projection: { _id: 1 }, session });

	return user?._id;
}

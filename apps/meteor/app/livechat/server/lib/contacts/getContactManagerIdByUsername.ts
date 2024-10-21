import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function getContactManagerIdByUsername(username?: IUser['username']): Promise<IUser['_id'] | undefined> {
	if (!username) {
		return;
	}

	const user = await Users.findOneByUsername<Pick<IUser, '_id'>>(username, { projection: { _id: 1 } });

	return user?._id;
}

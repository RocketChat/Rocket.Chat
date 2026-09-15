import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { FindCursor } from 'mongodb';

type ResolvedUsers = { ids: IUser['_id'][]; usernames: NonNullable<IUser['username']>[] };

const collectUsers = async (users: FindCursor<Pick<IUser, '_id' | 'username'>>): Promise<ResolvedUsers> => {
	const resolved: ResolvedUsers = { ids: [], usernames: [] };

	for await (const { _id, username } of users) {
		if (username) {
			resolved.ids.push(_id);
			resolved.usernames.push(username);
		}
	}

	return resolved;
};

export const resolveUsersByIds = async (ids: IUser['_id'][]): Promise<ResolvedUsers> =>
	ids.length
		? collectUsers(Users.findByIds<Pick<IUser, '_id' | 'username'>>(ids, { projection: { username: 1 } }))
		: { ids: [], usernames: [] };

export const resolveUsersByUsernames = async (usernames: string[]): Promise<ResolvedUsers> =>
	usernames.length ? collectUsers(Users.findByUsernames(usernames, { projection: { username: 1 } })) : { ids: [], usernames: [] };

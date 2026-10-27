import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

// direct rooms carry no `name`; the member set is what identifies them
export const findDirectRoomByIdentifier = async (identifier: string, uid: IUser['_id']): Promise<IRoom | null> => {
	const targets = identifier.split(',').map((username) => username.trim());

	// only a single target can be a room id, since ids never contain commas.
	if (targets.length === 1) {
		const byId = await Rooms.findByTypeAndNameOrId('d', targets[0]);
		if (byId) {
			return byId;
		}
	}

	const me = await Users.findOneById<Pick<IUser, 'username'>>(uid, { projection: { username: 1 } });
	if (!me?.username) {
		return null;
	}

	const usernames = [...new Set([me.username, ...targets])];
	const members = await Users.findUsersByUsernames<Pick<IUser, '_id'>>(usernames, { projection: { _id: 1 } }).toArray();
	if (members.length !== usernames.length) {
		return null;
	}

	const uids = members.map(({ _id }) => _id).sort();

	return Rooms.findOneDirectRoomContainingAllUserIDs(uids);
};

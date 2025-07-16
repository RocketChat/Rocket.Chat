import type { IUser } from '@rocket.chat/core-typings';
import { isNotUndefined } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { notifyOnSubscriptionChangedByRoomId } from '../lib/notifyListener';

const getFname = (members: IUser[]): string => members.map(({ name, username }) => name || username).join(', ');
const getName = (members: IUser[]): string => members.map(({ username }) => username).join(',');

async function getUsersWhoAreInTheSameGroupDMsAs(user: IUser) {
	// add all users to single array so we can fetch details from them all at once
	if ((await Rooms.countGroupDMsByUids([user._id])) === 0) {
		return;
	}

	const userIds = new Set<string>();
	const users = new Map<string, IUser>();

	const rooms = Rooms.findGroupDMsByUids([user._id], { projection: { uids: 1 } });
	await rooms.forEach((room) => {
		if (!room.uids) {
			return;
		}

		room.uids.forEach((uid) => uid !== user._id && userIds.add(uid));
	});

	(await Users.findByIds([...userIds], { projection: { username: 1, name: 1 } }).toArray()).forEach((user) => users.set(user._id, user));

	return users;
}

function sortUsersAlphabetically(u1: IUser, u2: IUser): number {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return (u1.name! || u1.username!).localeCompare(u2.name! || u2.username!);
}

export const updateGroupDMsName = async (
	userThatChangedName: IUser,
	options?: {
		session?: ClientSession;
	},
): Promise<void> => {
	if (!userThatChangedName.username) {
		return;
	}

	const users = await getUsersWhoAreInTheSameGroupDMsAs(userThatChangedName);
	if (!users) {
		return;
	}

	users.set(userThatChangedName._id, userThatChangedName);

	const { session } = options || {};

	const rooms = Rooms.findGroupDMsByUids([userThatChangedName._id], { projection: { uids: 1 }, session });

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	const getMembers = (uids: string[]) => uids.map((uid) => users.get(uid)).filter(isNotUndefined);

	// loop rooms to update the subscriptions from them all
	for await (const room of rooms) {
		if (!room.uids) {
			return;
		}

		const members = getMembers(room.uids);
		const sortedMembers = members.sort(sortUsersAlphabetically);

		const subs = Subscriptions.findByRoomId(room._id, { projection: { '_id': 1, 'u._id': 1 }, session });
		for await (const sub of subs) {
			const otherMembers = sortedMembers.filter(({ _id }) => _id !== sub.u._id);
			const updateNameRespose = await Subscriptions.updateNameAndFnameById(sub._id, getName(otherMembers), getFname(otherMembers), {
				session,
			});
			if (updateNameRespose.modifiedCount) {
				void notifyOnSubscriptionChangedByRoomId(room._id);
			}
		}
	}
};

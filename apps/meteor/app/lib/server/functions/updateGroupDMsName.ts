import type { IDirectMessageRoom, IUser, ISubscription } from '@rocket.chat/core-typings';

import { Rooms, Subscriptions, Users } from '../../../models/server';

const getFname = (members: IUser[]): string => members.map(({ name, username }) => name || username).join(', ');
const getName = (members: IUser[]): string => members.map(({ username }) => username).join(',');

function getUsersWhoAreInTheSameGroupDMsAs(user: IUser): unknown {
	// add all users to single array so we can fetch details from them all at once
	const rooms = Rooms.findGroupDMsByUids(user._id, { fields: { uids: 1 } });
	if (rooms.count() === 0) {
		return;
	}

	const userIds = new Set();
	const users = new Map();

	rooms.forEach((room: IDirectMessageRoom) => room.uids.forEach((uid) => uid !== user._id && userIds.add(uid)));

	Users.findByIds([...userIds], { fields: { username: 1, name: 1 } }).forEach((user: IUser) => users.set(user._id, user));

	return users;
}

function sortUsersAlphabetically(u1: IUser, u2: IUser): number {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return (u1.name! || u1.username!).localeCompare(u2.name! || u2.username!);
}

export const updateGroupDMsName = (userThatChangedName: IUser): void => {
	if (!userThatChangedName.username) {
		return;
	}

	const users: any = getUsersWhoAreInTheSameGroupDMsAs(userThatChangedName);
	if (!users) {
		return;
	}

	users.set(userThatChangedName._id, userThatChangedName);

	const rooms = Rooms.findGroupDMsByUids(userThatChangedName._id, { fields: { uids: 1 } });

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	const getMembers = (uids: string[]) => uids.map((uid) => users.get(uid)).filter(Boolean);

	// loop rooms to update the subcriptions from them all
	rooms.forEach((room: IDirectMessageRoom) => {
		const members = getMembers(room.uids);
		const sortedMembers = members.sort(sortUsersAlphabetically);

		const subs = Subscriptions.findByRoomId(room._id, { fields: { '_id': 1, 'u._id': 1 } });
		subs.forEach((sub: ISubscription) => {
			const otherMembers = sortedMembers.filter(({ _id }) => _id !== sub.u._id);
			Subscriptions.updateNameAndFnameById(sub._id, getName(otherMembers), getFname(otherMembers));
		});
	});
};

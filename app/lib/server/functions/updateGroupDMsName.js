import { Rooms, Subscriptions, Users } from '../../../models/server';

const getFname = (members) => members.map(({ name, username }) => name || username).join(', ');
const getName = (members) => members.map(({ username }) => username).join(',');

export const updateGroupDMsName = (user) => {
	if (!user.username) {
		return;
	}

	const userIds = new Set();
	const users = new Map();

	const rooms = Rooms.findGroupDMsByUids(user._id, { fields: { uids: 1 } });

	if (rooms.count() === 0) {
		return;
	}

	// add all users to single array so we can fetch details from them all at once
	rooms.forEach((room) => room.uids.forEach((uid) => uid !== user._id && userIds.add(uid)));

	Users.findByIds([...userIds], { fields: { username: 1, name: 1 } })
		.forEach((user) => users.set(user._id, user));

	const getMembers = (uids) => uids.map((uid) => users.get(uid)).filter(Boolean);

	// loop rooms to update the subcriptions from them all
	rooms.forEach((room) => {
		const members = getMembers(room.uids);
		const sortedMembers = members.sort((u1, u2) => (u1.name || u1.username).localeCompare(u2.name || u2.username));

		const subs = Subscriptions.findByRoomId(room._id, { fields: { _id: 1, 'u._id': 1 } });
		subs.forEach((sub) => {
			const otherMembers = sortedMembers.filter(({ _id }) => _id !== sub.u._id);

			Subscriptions.updateNameAndFnameById(sub._id, getName(otherMembers), getFname(otherMembers));
		});
	});
};

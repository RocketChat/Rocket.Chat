import { Subscriptions, Users } from '../../../../../models/server';

module.exports = (room) => {
	let hasFederatedUser = false;

	let users = null;
	let subscriptions = null;

	if (room.t === 'd') {
		// Check if there is a federated user on this room
		hasFederatedUser = room.usernames.find((u) => u.indexOf('@') !== -1);
	} else {
		// Find all subscriptions of this room
		subscriptions = Subscriptions.findByRoomIdWhenUsernameExists(room._id).fetch();
		subscriptions = subscriptions.reduce((acc, s) => {
			acc[s.u._id] = s;

			return acc;
		}, {});

		// Get all user ids
		const userIds = Object.keys(subscriptions);

		// Load all the users
		users = Users.findUsersWithUsernameByIds(userIds).fetch();

		// Check if there is a federated user on this room
		hasFederatedUser = users.find((u) => u.username.indexOf('@') !== -1);
	}

	return {
		hasFederatedUser,
		users,
		subscriptions,
	};
};

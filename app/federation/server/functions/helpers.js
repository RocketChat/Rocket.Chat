import { Settings, Subscriptions, Users } from '../../../models/server';

export const getNameAndDomain = (fullyQualifiedName) => fullyQualifiedName.split('@');
export const isFullyQualified = (name) => name.indexOf('@') !== -1;

export function updateStatus(status) {
	Settings.updateValueById('FEDERATION_Status', status);
}

export function updateEnabled(enabled) {
	Settings.updateValueById('FEDERATION_Enabled', enabled);
}

export const isFederated = (resource) => !!resource.federation;

export const getFederatedRoomData = (room) => {
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

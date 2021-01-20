import { Settings, Subscriptions, Users } from '../../../models/server';
import { STATUS_ENABLED, STATUS_REGISTERING } from '../constants';

export const getNameAndDomain = (fullyQualifiedName) => fullyQualifiedName.split('@');
export const isFullyQualified = (name) => name.indexOf('@') !== -1;

export function isRegisteringOrEnabled() {
	const status = Settings.findOneById('FEDERATION_Status');
	return [STATUS_ENABLED, STATUS_REGISTERING].includes(status && status.value);
}

export function updateStatus(status) {
	Settings.updateValueById('FEDERATION_Status', status);
}

export function updateEnabled(enabled) {
	Settings.updateValueById('FEDERATION_Enabled', enabled);
}

export const checkRoomType = (room) => room.t === 'p' || room.t === 'd';
export const checkRoomDomainsLength = (domains) => domains.length <= (process.env.FEDERATED_DOMAINS_LENGTH || 10);

export const hasExternalDomain = ({ federation }) => {
	// same test as isFederated(room)
	if (!federation) {
		return false;
	}

	return federation.domains
		.some((domain) => domain !== federation.origin);
};

export const isLocalUser = ({ federation }, localDomain) =>
	!federation || federation.origin === localDomain;

export const getFederatedRoomData = (room) => {
	let hasFederatedUser = false;

	let users = null;
	let subscriptions = null;

	if (room.t === 'd') {
		// Check if there is a federated user on this room
		hasFederatedUser = room.usernames.some(isFullyQualified);
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
		hasFederatedUser = users.some((u) => isFullyQualified(u.username));
	}

	return {
		hasFederatedUser,
		users,
		subscriptions,
	};
};

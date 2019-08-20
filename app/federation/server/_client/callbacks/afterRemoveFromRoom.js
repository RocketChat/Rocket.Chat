import { callbacks } from '../../../../callbacks';
import { FederationRoomEvents } from '../../../../models/server';
import getFederatedRoomData from './helpers/getFederatedRoomData';
import getFederatedUserData from './helpers/getFederatedUserData';
import { logger } from '../../logger';
import { normalizers } from '../../normalizers';
import { Federation } from '../../federation';

async function afterRemoveFromRoom(involvedUsers, room) {
	const { removedUser } = involvedUsers;

	const { hasFederatedUser, users } = getFederatedRoomData(room);

	// If there are not federated users on this room, ignore it
	if (!hasFederatedUser && !getFederatedUserData(removedUser).isFederated) { return; }

	logger.client.debug(`afterRemoveFromRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	try {
		// Get the domains after removal
		const domainsAfterRemoval = users.map((u) => u.federation.origin);

		//
		// Normalize the room's federation status
		//
		const usersBeforeRemoval = users;
		usersBeforeRemoval.push(removedUser);

		// Get the users domains
		const domainsBeforeRemoval = usersBeforeRemoval.map((u) => u.federation.origin);

		//
		// Create the user remove event
		//
		const normalizedSourceUser = normalizers.normalizeUser(removedUser);

		const removeUserEvent = await FederationRoomEvents.createRemoveUserEvent(Federation.domain, room._id, normalizedSourceUser, domainsAfterRemoval);

		// Dispatch the events
		Federation.client.dispatchEvent(domainsBeforeRemoval, removeUserEvent);
	} catch (err) {
		logger.client.error(`afterRemoveFromRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } => Could not add user: ${ err }`);

		throw err;
	}

	return involvedUsers;
}

callbacks.add('afterRemoveFromRoom', (roomOwner, room) => Promise.await(afterRemoveFromRoom(roomOwner, room)), callbacks.priority.LOW, 'federation-after-remove-from-room');

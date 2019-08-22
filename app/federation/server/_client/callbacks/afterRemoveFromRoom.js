import { FederationRoomEvents } from '../../../../models/server';
import { isFederated, getFederatedRoomData } from './helpers/federatedResources';
import { logger } from '../../logger';
import { normalizers } from '../../normalizers';
import { Federation } from '../../federation';

async function afterRemoveFromRoom(involvedUsers, room) {
	const { removedUser } = involvedUsers;

	// If there are not federated users on this room, ignore it
	if (!isFederated(room) && !isFederated(removedUser)) { return; }

	logger.client.debug(() => `afterRemoveFromRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	const { users } = getFederatedRoomData(room);

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

export const definition = {
	hook: 'afterRemoveFromRoom',
	callback: (roomOwner, room) => Promise.await(afterRemoveFromRoom(roomOwner, room)),
	id: 'federation-after-remove-from-room',
};

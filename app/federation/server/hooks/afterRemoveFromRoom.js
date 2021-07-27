import { FederationRoomEvents } from '../../../models/server';
import { getFederatedRoomData, hasExternalDomain, isLocalUser } from '../functions/helpers';
import { logger } from '../lib/logger';
import { normalizers } from '../normalizers';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

async function afterRemoveFromRoom(involvedUsers, room) {
	const { removedUser } = involvedUsers;

	const localDomain = getFederationDomain();

	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room) && isLocalUser(removedUser, localDomain)) {
		return involvedUsers;
	}

	logger.client.debug(() => `afterRemoveFromRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	const { users } = getFederatedRoomData(room);

	try {
		// Get the domains after removal
		const domainsAfterRemoval = [...new Set(users.map((u) => u.federation.origin))];

		//
		// Normalize the room's federation status
		//
		const usersBeforeRemoval = users;
		usersBeforeRemoval.push(removedUser);

		// Get the users domains
		const domainsBeforeRemoval = [...new Set(usersBeforeRemoval.map((u) => u.federation.origin))];

		//
		// Create the user remove event
		//
		const normalizedSourceUser = normalizers.normalizeUser(removedUser);

		const removeUserEvent = await FederationRoomEvents.createRemoveUserEvent(localDomain, room._id, normalizedSourceUser, domainsAfterRemoval);

		// Dispatch the events
		dispatchEvent(domainsBeforeRemoval, removeUserEvent);
	} catch (err) {
		logger.client.error('afterRemoveFromRoom => Could not remove user:', err);
	}

	return involvedUsers;
}

export const definition = {
	hook: 'afterRemoveFromRoom',
	callback: (roomOwner, room) => Promise.await(afterRemoveFromRoom(roomOwner, room)),
	id: 'federation-after-remove-from-room',
};

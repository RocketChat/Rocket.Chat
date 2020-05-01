import { FederationRoomEvents } from '../../../models/server';
import { getFederatedRoomData, hasExternalDomain, isLocalUser } from '../functions/helpers';
import { logger } from '../lib/logger';
import { normalizers } from '../normalizers';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

async function afterLeaveRoom(user, room) {
	const localDomain = getFederationDomain();

	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room) && isLocalUser(user, localDomain)) {
		return user;
	}

	logger.client.debug(() => `afterLeaveRoom => user=${ JSON.stringify(user, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	const { users } = getFederatedRoomData(room);

	try {
		// Get the domains after leave
		const domainsAfterLeave = [...new Set(users.map((u) => u.federation.origin))];

		//
		// Normalize the room's federation status
		//
		const usersBeforeLeave = users;
		usersBeforeLeave.push(user);

		// Get the users domains
		const domainsBeforeLeft = [...new Set(usersBeforeLeave.map((u) => u.federation.origin))];

		//
		// Create the user left event
		//
		const normalizedSourceUser = normalizers.normalizeUser(user);

		const userLeftEvent = await FederationRoomEvents.createUserLeftEvent(localDomain, room._id, normalizedSourceUser, domainsAfterLeave);

		// Dispatch the events
		dispatchEvent(domainsBeforeLeft, userLeftEvent);
	} catch (err) {
		logger.client.error('afterLeaveRoom => Could not make user leave:', err);
	}

	return user;
}

export const definition = {
	hook: 'afterLeaveRoom',
	callback: (roomOwner, room) => Promise.await(afterLeaveRoom(roomOwner, room)),
	id: 'federation-after-leave-room',
};

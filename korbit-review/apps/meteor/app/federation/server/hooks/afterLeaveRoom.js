import { FederationRoomEvents } from '@rocket.chat/models';

import { getFederatedRoomData, hasExternalDomain, isLocalUser } from '../functions/helpers';
import { dispatchEvent } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

async function afterLeaveRoom(user, room) {
	const localDomain = getFederationDomain();

	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room) && isLocalUser(user, localDomain)) {
		return user;
	}

	clientLogger.debug({ msg: 'afterLeaveRoom', user, room });

	const { users } = await getFederatedRoomData(room);

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
		const normalizedSourceUser = await normalizers.normalizeUser(user);

		const userLeftEvent = await FederationRoomEvents.createUserLeftEvent(localDomain, room._id, normalizedSourceUser, domainsAfterLeave);

		// Dispatch the events
		dispatchEvent(domainsBeforeLeft, userLeftEvent);
	} catch (err) {
		clientLogger.error({ msg: 'afterLeaveRoom => Could not make user leave:', err });
	}

	return user;
}

export const definition = {
	hook: 'afterLeaveRoom',
	callback: afterLeaveRoom,
	id: 'federation-after-leave-room',
};

import { callbacks } from '../../../../callbacks';
import { FederationRoomEvents } from '../../../../models/server';
import getFederatedRoomData from './helpers/getFederatedRoomData';
import { logger } from '../../logger';
import { normalizers } from '../../normalizers';
import { Federation } from '../../federation';

async function beforeRemoveFromRoom(involvedUsers, room) {
	const { removedUser } = involvedUsers;

	// If there are not federated users on this room, ignore it
	if (!getFederatedRoomData(room).hasFederatedUser) { return; }

	logger.client.debug(`beforeRemoveFromRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	try {
		//
		// Create the user add event
		//
		const normalizedSourceUser = normalizers.normalizeUser(removedUser);

		const removeUserEvent = await FederationRoomEvents.createRemoveUserEvent(Federation.domain, room._id, normalizedSourceUser);

		// Dispatch the events
		Federation.client.dispatchEvent(room.federation.domains, removeUserEvent);
	} catch (err) {
		logger.client.error(`beforeRemoveFromRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } => Could not add user: ${ err }`);

		throw err;
	}

	return involvedUsers;
}

callbacks.add('beforeRemoveFromRoom', (roomOwner, room) => Promise.await(beforeRemoveFromRoom(roomOwner, room)), callbacks.priority.LOW, 'federation-before-remove-from-room');

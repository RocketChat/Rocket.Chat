import { FederationRoomEvents, Rooms } from '@rocket.chat/models';

import { hasExternalDomain } from '../functions/helpers';
import { dispatchEvent } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';

async function beforeDeleteRoom(roomId) {
	const room = await Rooms.findOneById(roomId, { projection: { federation: 1 } });

	// If room does not exist, skip
	if (!room) {
		return roomId;
	}

	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return roomId;
	}

	clientLogger.debug({ msg: 'beforeDeleteRoom', room });

	try {
		// Create the message event
		const event = await FederationRoomEvents.createDeleteRoomEvent(getFederationDomain(), room._id);

		// Dispatch event (async)
		dispatchEvent(room.federation.domains, event);
	} catch (err) {
		clientLogger.error({ msg: 'beforeDeleteRoom => Could not remove room:', err });

		throw err;
	}

	return roomId;
}

export const definition = {
	hook: 'beforeDeleteRoom',
	callback: beforeDeleteRoom,
	id: 'federation-before-delete-room',
};

import { clientLogger } from '../lib/logger';
import { FederationRoomEvents, Rooms } from '../../../models/server';
import { hasExternalDomain } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

async function beforeDeleteRoom(roomId) {
	const room = Rooms.findOneById(roomId, { fields: { federation: 1 } });

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
	callback: (roomId) => Promise.await(beforeDeleteRoom(roomId)),
	id: 'federation-before-delete-room',
};

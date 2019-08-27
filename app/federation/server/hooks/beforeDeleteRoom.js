import { logger } from '../lib/logger';
import { FederationRoomEvents, Rooms } from '../../../models/server';
import { isFederated } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';

async function beforeDeleteRoom(roomId) {
	const room = Rooms.findOneById(roomId, { fields: { _id: 1, federation: 1 } });

	// If room does not exist, skip
	if (!room) { return; }

	// If there are not federated users on this room, ignore it
	if (!isFederated(room)) { return; }

	logger.client.debug(() => `beforeDeleteRoom => room=${ JSON.stringify(room, null, 2) }`);

	try {
		// Create the message event
		const event = await FederationRoomEvents.createDeleteRoomEvent(getFederationDomain(), room._id);

		// Dispatch event (async)
		dispatchEvent(room.federation.domains, event);
	} catch (err) {
		logger.client.error(() => `beforeDeleteRoom => room=${ JSON.stringify(room, null, 2) } => Could not remove room: ${ err }`);

		throw err;
	}

	return roomId;
}

export const definition = {
	hook: 'beforeDeleteRoom',
	callback: (roomId) => Promise.await(beforeDeleteRoom(roomId)),
	id: 'federation-before-delete-room',
};

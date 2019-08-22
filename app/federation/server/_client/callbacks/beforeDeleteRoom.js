import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import { FederationRoomEvents, Rooms } from '../../../../models/server';
import { Federation } from '../../federation';
import getFederatedRoomData from './helpers/getFederatedRoomData';

async function beforeDeleteRoom(roomId) {
	const room = Rooms.findOneById(roomId);

	// If room does not exist, skip
	if (!room) { return; }

	// If there are not federated users on this room, ignore it
	if (!getFederatedRoomData(room).hasFederatedUser) { return; }

	logger.client.debug(`beforeDeleteRoom => room=${ JSON.stringify(room, null, 2) }`);

	try {
		// Create the message event
		const event = await FederationRoomEvents.createDeleteRoomEvent(Federation.domain, room._id);

		// Dispatch event (async)
		Federation.client.dispatchEvent(room.federation.domains, event);
	} catch (err) {
		logger.client.error(`beforeDeleteRoom => room=${ JSON.stringify(room, null, 2) } => Could not remove room: ${ err }`);

		throw err;
	}

	return roomId;
}

callbacks.add('beforeDeleteRoom', (roomId) => Promise.await(beforeDeleteRoom(roomId)), callbacks.priority.LOW, 'federation-before-delete-room');

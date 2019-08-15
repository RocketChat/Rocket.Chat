import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import { FederationRoomEvents, Rooms } from '../../../../models/server';
import { Federation } from '../../federation';

async function afterDeleteRoom(roomId) {
	const room = Rooms.findOneById(roomId);

	logger.client.debug(`afterDeleteRoom => room=${ JSON.stringify(room, null, 2) }`);

	// If room does not exist, skip
	if (!room) { return; }

	// Currently, only direct rooms
	if (room.t !== 'd') { return; }

	// Check if there is a federated user on this room
	const hasFederatedUser = room.usernames.find((u) => u.indexOf('@') !== -1);

	// If there are not federated users on this room, ignore it
	if (!hasFederatedUser) { return; }

	// Create the message event
	const event = await FederationRoomEvents.createDeleteRoomEvent(Federation.domain, room._id);

	// Dispatch event (async)
	Federation.client.dispatchEvent(room.federation.domains, event);

	return roomId;
}

callbacks.add('afterDeleteRoom', (roomId) => Promise.await(afterDeleteRoom(roomId)), callbacks.priority.LOW, 'federation-after-delete-message');

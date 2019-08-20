import { FederationRoomEvents, Rooms } from '../../../../models/server';
import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import { Federation } from '../../federation';
import getFederatedRoomData from './helpers/getFederatedRoomData';

async function afterDeleteMessage(message) {
	const room = Rooms.findOneById(message.rid);

	// If there are not federated users on this room, ignore it
	if (!getFederatedRoomData(room).hasFederatedUser) { return; }

	logger.client.debug(`afterDeleteMessage => message=${ JSON.stringify(message, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	// Create the delete message event
	const event = await FederationRoomEvents.createDeleteMessageEvent(Federation.domain, room._id, message._id);

	// Dispatch event (async)
	Federation.client.dispatchEvent(room.federation.domains, event);

	return message;
}

callbacks.add('afterDeleteMessage', (message) => Promise.await(afterDeleteMessage(message)), callbacks.priority.LOW, 'federation-after-delete-message');

import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import { FederationRoomEvents } from '../../../../models/server';
import { Federation } from '../../federation';
import { normalizers } from '../../normalizers';
import getFederatedRoomData from './helpers/getFederatedRoomData';

async function afterSaveMessage(message, room) {
	// If there are not federated users on this room, ignore it
	if (!getFederatedRoomData(room).hasFederatedUser) { return; }

	logger.client.debug(`afterSaveMessage => message=${ JSON.stringify(message, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	let event;

	// If editedAt exists, it means it is an update
	if (message.editedAt) {
		// Create the edit message event
		event = await FederationRoomEvents.createEditMessageEvent(Federation.domain, room._id, normalizers.normalizeMessage(message));
	} else {
		// Create the message event
		event = await FederationRoomEvents.createMessageEvent(Federation.domain, room._id, normalizers.normalizeMessage(message));
	}

	// Dispatch event (async)
	Federation.client.dispatchEvent(room.federation.domains, event);

	return message;
}

callbacks.add('afterSaveMessage', (message, room) => Promise.await(afterSaveMessage(message, room)), callbacks.priority.LOW, 'federation-after-save-message');

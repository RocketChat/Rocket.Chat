import { logger } from '../../logger';
import { FederationRoomEvents } from '../../../../models/server';
import { Federation } from '../../federation';
import { normalizers } from '../../normalizers';
import { isFederated } from './helpers/federatedResources';

async function afterSaveMessage(message, room) {
	console.log('afterSaveMessage');
	// If there are not federated users on this room, ignore it
	if (!isFederated(room)) { return; }

	logger.client.debug(() => `afterSaveMessage => message=${ JSON.stringify(message, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

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

export const definition = {
	hook: 'afterSaveMessage',
	callback: (message, room) => Promise.await(afterSaveMessage(message, room)),
	id: 'federation-after-save-message',
};

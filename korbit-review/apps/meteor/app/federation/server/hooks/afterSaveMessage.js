import { FederationRoomEvents } from '@rocket.chat/models';

import { hasExternalDomain } from '../functions/helpers';
import { dispatchEvent } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

async function afterSaveMessage(message, { room }) {
	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return message;
	}

	clientLogger.debug({ msg: 'afterSaveMessage', message, room });

	let event;

	// If editedAt exists, it means it is an update
	if (message.editedAt) {
		// Create the edit message event
		event = await FederationRoomEvents.createEditMessageEvent(getFederationDomain(), room._id, normalizers.normalizeMessage(message));
	} else {
		// Create the message event
		event = await FederationRoomEvents.createMessageEvent(getFederationDomain(), room._id, normalizers.normalizeMessage(message));
	}

	// Dispatch event (async)
	dispatchEvent(room.federation.domains, event);

	return message;
}

export const definition = {
	hook: 'afterSaveMessage',
	callback: afterSaveMessage,
	id: 'federation-after-save-message',
};

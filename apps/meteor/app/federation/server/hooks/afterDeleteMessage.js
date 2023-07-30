import { FederationRoomEvents, Rooms } from '@rocket.chat/models';

import { hasExternalDomain } from '../functions/helpers';
import { dispatchEvent } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';

async function afterDeleteMessage(message) {
	const room = await Rooms.findOneById(message.rid, { projection: { federation: 1 } });

	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return message;
	}

	clientLogger.debug({ msg: 'afterDeleteMessage', message, room });

	// Create the delete message event
	const event = await FederationRoomEvents.createDeleteMessageEvent(getFederationDomain(), room._id, message._id);

	// Dispatch event (async)
	dispatchEvent(room.federation.domains, event);

	return message;
}

export const definition = {
	hook: 'afterDeleteMessage',
	callback: afterDeleteMessage,
	id: 'federation-after-delete-message',
};

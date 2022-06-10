import { FederationRoomEvents, Rooms } from '../../../models/server';
import { clientLogger } from '../lib/logger';
import { hasExternalDomain } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

async function afterDeleteMessage(message) {
	const room = Rooms.findOneById(message.rid, { fields: { federation: 1 } });

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
	callback: (message) => Promise.await(afterDeleteMessage(message)),
	id: 'federation-after-delete-message',
};

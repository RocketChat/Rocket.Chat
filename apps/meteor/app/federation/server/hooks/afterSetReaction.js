import { FederationRoomEvents, Rooms } from '@rocket.chat/models';

import { hasExternalDomain } from '../functions/helpers';
import { dispatchEvent } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';

async function afterSetReaction(message, { user, reaction }) {
	const room = await Rooms.findOneById(message.rid, { projection: { federation: 1 } });

	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return message;
	}

	clientLogger.debug({ msg: 'afterSetReaction', message, room, user, reaction });

	// Create the event
	const event = await FederationRoomEvents.createSetMessageReactionEvent(
		getFederationDomain(),
		room._id,
		message._id,
		user.username,
		reaction,
	);

	// Dispatch event (async)
	dispatchEvent(room.federation.domains, event);

	return message;
}

export const definition = {
	hook: 'afterSetReaction',
	callback: afterSetReaction,
	id: 'federation-after-set-reaction',
};

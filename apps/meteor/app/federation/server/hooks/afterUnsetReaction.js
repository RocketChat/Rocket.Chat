import { FederationRoomEvents, Rooms } from '@rocket.chat/models';

import { hasExternalDomain } from '../functions/helpers';
import { dispatchEvent } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';

async function afterUnsetReaction(message, { user, reaction }) {
	const room = Rooms.findOneById(message.rid, { fields: { federation: 1 } });

	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return message;
	}

	clientLogger.debug({ msg: 'afterUnsetReaction', message, room, user, reaction });

	// Create the event
	const event = await FederationRoomEvents.createUnsetMessageReactionEvent(
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
	hook: 'afterUnsetReaction',
	callback: afterUnsetReaction,
	id: 'federation-after-unset-reaction',
};

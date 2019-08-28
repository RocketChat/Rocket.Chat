import { FederationRoomEvents } from '../../../../models/server';
import { logger } from '../../logger';
import { Federation } from '../../federation';
import { normalizers } from '../../normalizers';
import { isFederated } from './helpers/federatedResources';

async function afterMuteUser(involvedUsers, room) {
	// If there are not federated users on this room, ignore it
	if (!isFederated(room)) { return; }

	logger.client.debug(() => `afterMuteUser => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	const { mutedUser } = involvedUsers;

	// Create the mute user event
	const event = await FederationRoomEvents.createMuteUserEvent(Federation.domain, room._id, normalizers.normalizeUser(mutedUser));

	// Dispatch event (async)
	Federation.client.dispatchEvent(room.federation.domains, event);

	return involvedUsers;
}

export const definition = {
	hook: 'afterMuteUser',
	callback: (involvedUsers, room) => Promise.await(afterMuteUser(involvedUsers, room)),
	id: 'federation-after-mute-user',
};

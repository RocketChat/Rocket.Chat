import { FederationRoomEvents } from '../../../../models/server';
import { logger } from '../../logger';
import { Federation } from '../../federation';
import { normalizers } from '../../normalizers';
import { isFederated } from './helpers/federatedResources';

async function afterUnmuteUser(involvedUsers, room) {
	// If there are not federated users on this room, ignore it
	if (!isFederated(room)) { return; }

	logger.client.debug(() => `afterUnmuteUser => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	const { unmutedUser } = involvedUsers;

	// Create the mute user event
	const event = await FederationRoomEvents.createUnmuteUserEvent(Federation.domain, room._id, normalizers.normalizeUser(unmutedUser));

	// Dispatch event (async)
	Federation.client.dispatchEvent(room.federation.domains, event);

	return involvedUsers;
}

export const definition = {
	hook: 'afterUnmuteUser',
	callback: (involvedUsers, room) => Promise.await(afterUnmuteUser(involvedUsers, room)),
	id: 'federation-after-unmute-user',
};

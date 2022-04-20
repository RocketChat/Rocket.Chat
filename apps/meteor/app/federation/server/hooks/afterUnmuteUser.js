import { FederationRoomEvents } from '../../../models/server';
import { clientLogger } from '../lib/logger';
import { normalizers } from '../normalizers';
import { hasExternalDomain } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

async function afterUnmuteUser(involvedUsers, room) {
	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return involvedUsers;
	}

	clientLogger.debug({ msg: 'afterUnmuteUser', involvedUsers, room });

	const { unmutedUser } = involvedUsers;

	// Create the mute user event
	const event = await FederationRoomEvents.createUnmuteUserEvent(getFederationDomain(), room._id, normalizers.normalizeUser(unmutedUser));

	// Dispatch event (async)
	dispatchEvent(room.federation.domains, event);

	return involvedUsers;
}

export const definition = {
	hook: 'afterUnmuteUser',
	callback: (involvedUsers, room) => Promise.await(afterUnmuteUser(involvedUsers, room)),
	id: 'federation-after-unmute-user',
};

import { FederationRoomEvents } from '../../../models/server';
import { clientLogger } from '../lib/logger';
import { normalizers } from '../normalizers';
import { hasExternalDomain } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

async function afterMuteUser(involvedUsers, room) {
	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return involvedUsers;
	}

	clientLogger.debug({ msg: 'afterMuteUser', involvedUsers, room });

	const { mutedUser } = involvedUsers;

	// Create the mute user event
	const event = await FederationRoomEvents.createMuteUserEvent(getFederationDomain(), room._id, normalizers.normalizeUser(mutedUser));

	// Dispatch event (async)
	dispatchEvent(room.federation.domains, event);

	return involvedUsers;
}

export const definition = {
	hook: 'afterMuteUser',
	callback: (involvedUsers, room) => Promise.await(afterMuteUser(involvedUsers, room)),
	id: 'federation-after-mute-user',
};

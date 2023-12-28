import { FederationRoomEvents } from '@rocket.chat/models';

import { hasExternalDomain } from '../functions/helpers';
import { dispatchEvent } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

async function afterMuteUser(involvedUsers, room) {
	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return involvedUsers;
	}

	clientLogger.debug({ msg: 'afterMuteUser', involvedUsers, room });

	const { mutedUser } = involvedUsers;

	// Create the mute user event
	const event = await FederationRoomEvents.createMuteUserEvent(getFederationDomain(), room._id, await normalizers.normalizeUser(mutedUser));

	// Dispatch event (async)
	dispatchEvent(room.federation.domains, event);

	return involvedUsers;
}

export const definition = {
	hook: 'afterMuteUser',
	callback: afterMuteUser,
	id: 'federation-after-mute-user',
};

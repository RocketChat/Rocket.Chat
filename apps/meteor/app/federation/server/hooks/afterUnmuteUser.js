import { FederationRoomEvents } from '@rocket.chat/models';

import { hasExternalDomain } from '../functions/helpers';
import { dispatchEvent } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

async function afterUnmuteUser(involvedUsers, room) {
	// If there are not federated users on this room, ignore it
	if (!hasExternalDomain(room)) {
		return involvedUsers;
	}

	clientLogger.debug({ msg: 'afterUnmuteUser', involvedUsers, room });

	const { unmutedUser } = involvedUsers;

	// Create the mute user event
	const event = await FederationRoomEvents.createUnmuteUserEvent(
		getFederationDomain(),
		room._id,
		await normalizers.normalizeUser(unmutedUser),
	);

	// Dispatch event (async)
	dispatchEvent(room.federation.domains, event);

	return involvedUsers;
}

export const definition = {
	hook: 'afterUnmuteUser',
	callback: afterUnmuteUser,
	id: 'federation-after-unmute-user',
};

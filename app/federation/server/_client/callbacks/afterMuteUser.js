import { FederationRoomEvents } from '../../../../models/server';
import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import { Federation } from '../../federation';
import { normalizers } from '../../normalizers';
import getFederatedRoomData from './helpers/getFederatedRoomData';

async function afterMuteUser(involvedUsers, room) {
	// If there are not federated users on this room, ignore it
	if (!getFederatedRoomData(room).hasFederatedUser) { return; }

	logger.client.debug(`afterMuteUser => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	const { mutedUser } = involvedUsers;

	// Create the mute user event
	const event = await FederationRoomEvents.createMuteUserEvent(Federation.domain, room._id, normalizers.normalizeUser(mutedUser));

	// Dispatch event (async)
	Federation.client.dispatchEvent(room.federation.domains, event);

	return involvedUsers;
}

callbacks.add('afterMuteUser', (involvedUsers, room) => Promise.await(afterMuteUser(involvedUsers, room)), callbacks.priority.LOW, 'federation-after-mute-user');

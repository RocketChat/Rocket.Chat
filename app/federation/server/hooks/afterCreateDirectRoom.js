import { logger } from '../lib/logger';
import { FederationRoomEvents, Subscriptions } from '../../../models/server';
import { normalizers } from '../normalizers';
import { deleteRoom } from '../../../lib/server/functions';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvents } from '../handler';
import { isFullyQualified } from '../functions/helpers';

async function afterCreateDirectRoom(room, extras) {
	logger.client.debug(() => `afterCreateDirectRoom => room=${ JSON.stringify(room, null, 2) } extras=${ JSON.stringify(extras, null, 2) }`);

	// If the room is federated, ignore
	if (room.federation) { return room; }

	// Check if there is a federated user on this direct room
	const hasFederatedUser = room.usernames.some(isFullyQualified);

	// If there are not federated users on this room, ignore it
	if (!hasFederatedUser) { return room; }

	try {
		//
		// Genesis
		//

		// Normalize room
		const normalizedRoom = normalizers.normalizeRoom(room);

		// Ensure a genesis event for this room
		const genesisEvent = await FederationRoomEvents.createGenesisEvent(getFederationDomain(), normalizedRoom);

		//
		// Source User
		//

		// Add the source user to the room
		const sourceUser = extras.from;
		const normalizedSourceUser = normalizers.normalizeUser(sourceUser);

		const sourceSubscription = Subscriptions.findOne({ rid: normalizedRoom._id, 'u._id': normalizedSourceUser._id });
		const normalizedSourceSubscription = normalizers.normalizeSubscription(sourceSubscription);

		// Build the source user event
		const sourceUserEvent = await FederationRoomEvents.createAddUserEvent(getFederationDomain(), normalizedRoom._id, normalizedSourceUser, normalizedSourceSubscription);

		//
		// Target User
		//

		// Add the target user to the room
		const targetUser = extras.to;
		const normalizedTargetUser = normalizers.normalizeUser(targetUser);

		const targetSubscription = Subscriptions.findOne({ rid: normalizedRoom._id, 'u._id': normalizedTargetUser._id });
		const normalizedTargetSubscription = normalizers.normalizeSubscription(targetSubscription);

		// Dispatch the target user event
		const targetUserEvent = await FederationRoomEvents.createAddUserEvent(getFederationDomain(), normalizedRoom._id, normalizedTargetUser, normalizedTargetSubscription);

		// Dispatch the events
		dispatchEvents(normalizedRoom.federation.domains, [genesisEvent, sourceUserEvent, targetUserEvent]);
	} catch (err) {
		await deleteRoom(room._id);

		logger.client.error('afterCreateDirectRoom => Could not create federated room:', err);
	}

	return room;
}

export const definition = {
	hook: 'afterCreateDirectRoom',
	callback: (room, extras) => Promise.await(afterCreateDirectRoom(room, extras)),
	id: 'federation-after-create-direct-room',
};

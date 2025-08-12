import { FederationRoomEvents, Subscriptions } from '@rocket.chat/models';

import { deleteRoom } from '../../../lib/server/functions/deleteRoom';
import { isFullyQualified } from '../functions/helpers';
import { dispatchEvents } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

async function afterCreateDirectRoom(room, extras) {
	clientLogger.debug({ msg: 'afterCreateDirectRoom', room, extras });

	// If the room is federated, ignore
	if (room.federation) {
		return room;
	}

	// Check if there is a federated user on this direct room
	const hasFederatedUser = room.usernames.some(isFullyQualified);

	// If there are not federated users on this room, ignore it
	if (!hasFederatedUser) {
		return room;
	}

	try {
		//
		// Genesis
		//

		// Normalize room
		const normalizedRoom = normalizers.normalizeRoom(room);

		// Ensure a genesis event for this room
		const genesisEvent = await FederationRoomEvents.createGenesisEvent(getFederationDomain(), normalizedRoom);

		const events = await Promise.all(
			extras.members.map(async (member) => {
				const normalizedMember = await normalizers.normalizeUser(member);

				const sourceSubscription = await Subscriptions.findOne({
					'rid': normalizedRoom._id,
					'u._id': normalizedMember._id,
				});
				const normalizedSourceSubscription = normalizers.normalizeSubscription(sourceSubscription);

				// Build the user event
				return FederationRoomEvents.createAddUserEvent(
					getFederationDomain(),
					normalizedRoom._id,
					normalizedMember,
					normalizedSourceSubscription,
				);
			}),
		);

		// Dispatch the events
		await dispatchEvents(normalizedRoom.federation.domains, [genesisEvent, ...events]);
	} catch (err) {
		await deleteRoom(room._id);

		clientLogger.error({ msg: 'afterCreateDirectRoom => Could not create federated room:', err });
	}

	return room;
}

export const definition = {
	hook: 'afterCreateDirectRoom',
	callback: afterCreateDirectRoom,
	id: 'federation-after-create-direct-room',
};

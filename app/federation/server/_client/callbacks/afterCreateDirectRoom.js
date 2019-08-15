import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import { FederationRoomEvents, Subscriptions, Users } from '../../../../models/server';
import { Federation } from '../../federation';
import { normalizers } from '../../normalizers';
import { deleteRoom } from '../../../../lib/server/functions';

async function afterCreateDirectRoom(room, extras) {
	logger.client.debug(`afterCreateDirectRoom => room=${ JSON.stringify(room, null, 2) } extras=${ JSON.stringify(extras, null, 2) }`);

	// If the room is federated, ignore
	if (room.federation) { return; }

	// Check if there is a federated user on this direct room
	const hasFederatedUser = room.usernames.find((u) => u.indexOf('@') !== -1);

	// If there are not federated users on this room, ignore it
	if (!hasFederatedUser) { return; }

	try {
		//
		// Genesis
		//

		// Normalize room
		const normalizedRoom = normalizers.normalizeRoom(room);

		// Ensure a genesis event for this room
		const genesisEvent = await FederationRoomEvents.createGenesisEvent(Federation.domain, normalizedRoom);

		//
		// Source User
		//

		// Add the source user to the room
		const sourceUser = Users.findOne({ username: room.usernames[0] });
		const normalizedSourceUser = normalizers.normalizeUser(sourceUser);

		const sourceSubscription = Subscriptions.findOne({ rid: normalizedRoom._id, 'u._id': normalizedSourceUser._id });
		const normalizedSourceSubscription = normalizers.normalizeSubscription(sourceSubscription);

		// Build the source user event
		const sourceUserEvent = await FederationRoomEvents.createAddUserEvent(Federation.domain, normalizedRoom._id, normalizedSourceUser, normalizedSourceSubscription);

		//
		// Target User
		//

		// Add the target user to the room
		const targetUser = Users.findOne({ username: room.usernames[1] });
		const normalizedTargetUser = normalizers.normalizeUser(targetUser);

		const targetSubscription = Subscriptions.findOne({ rid: normalizedRoom._id, 'u._id': normalizedTargetUser._id });
		const normalizedTargetSubscription = normalizers.normalizeSubscription(targetSubscription);

		// Dispatch the target user event
		const targetUserEvent = await FederationRoomEvents.createAddUserEvent(Federation.domain, normalizedRoom._id, normalizedTargetUser, normalizedTargetSubscription);

		// Dispatch the events
		Federation.client.dispatchEvents(normalizedRoom.federation.domains, [genesisEvent, sourceUserEvent, targetUserEvent]);
	} catch (err) {
		Promise.await(deleteRoom(room._id));

		logger.client.error(`afterCreateDirectRoom => room=${ JSON.stringify(room, null, 2) } => Could not create federated room: ${ err }`);
	}

	return room;
}

callbacks.add('afterCreateDirectRoom', (room, extras) => Promise.await(afterCreateDirectRoom(room, extras)), callbacks.priority.LOW, 'federation-after-create-direct-room');

import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import getFederatedRoomData from './helpers/getFederatedRoomData';
import { FederationRoomEvents, Subscriptions } from '../../../../models/server';
import { Federation } from '../../federation';
import { normalizers } from '../../normalizers';
import { doAfterCreateRoom } from './afterCreateRoom';

async function afterAddedToRoom(involvedUsers, room) {
	const { user } = involvedUsers;

	// If there are not federated users on this room, ignore it
	const { hasFederatedUser, users, subscriptions } = getFederatedRoomData(room);

	if (!hasFederatedUser) { return; }

	logger.client.debug(`afterAddedToRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	// Load the subscription
	const subscription = Promise.await(Subscriptions.findOneByRoomIdAndUserId(room._id, user._id));

	try {
		//
		// Check if the room is already federated, if it is not, create the genesis event
		//
		if (!room.federation) {
			//
			// Create the room with everything
			//

			await doAfterCreateRoom(room, users, subscriptions);
		} else {
			//
			// Create the user add event
			//

			const normalizedSourceUser = normalizers.normalizeUser(user);
			const normalizedSourceSubscription = normalizers.normalizeSubscription(subscription);

			const addUserEvent = await FederationRoomEvents.createAddUserEvent(Federation.domain, room._id, normalizedSourceUser, normalizedSourceSubscription);

			// Dispatch the events
			Federation.client.dispatchEvent(room.federation.domains, addUserEvent);
		}
	} catch (err) {
		// Remove the user subscription from the room
		Promise.await(Subscriptions.remove({ _id: subscription._id }));

		logger.client.error(`afterAddedToRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } => Could not add user: ${ err }`);
	}

	return involvedUsers;
}

callbacks.add('afterAddedToRoom', (roomOwner, room) => Promise.await(afterAddedToRoom(roomOwner, room)), callbacks.priority.LOW, 'federation-after-added-to-room');

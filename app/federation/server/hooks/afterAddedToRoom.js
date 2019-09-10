import { logger } from '../lib/logger';
import { getFederatedRoomData, hasExternalDomain, isLocalUser } from '../functions/helpers';
import { FederationRoomEvents, Subscriptions } from '../../../models/server';
import { normalizers } from '../normalizers';
import { doAfterCreateRoom } from './afterCreateRoom';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

async function afterAddedToRoom(involvedUsers, room) {
	const { user: addedUser } = involvedUsers;

	const localDomain = getFederationDomain();

	if (!hasExternalDomain(room) && isLocalUser(addedUser, localDomain)) {
		return;
	}

	logger.client.debug(() => `afterAddedToRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	// If there are not federated users on this room, ignore it
	const { users, subscriptions } = getFederatedRoomData(room);

	// Load the subscription
	const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, addedUser._id);

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
			// Normalize the room's federation status
			//

			// Get the users domains
			const domainsAfterAdd = users.map((u) => u.federation.origin);

			//
			// Create the user add event
			//

			const normalizedSourceUser = normalizers.normalizeUser(addedUser);
			const normalizedSourceSubscription = normalizers.normalizeSubscription(subscription);

			const addUserEvent = await FederationRoomEvents.createAddUserEvent(localDomain, room._id, normalizedSourceUser, normalizedSourceSubscription, domainsAfterAdd);

			// Dispatch the events
			dispatchEvent(domainsAfterAdd, addUserEvent);
		}
	} catch (err) {
		// Remove the user subscription from the room
		Subscriptions.remove({ _id: subscription._id });

		logger.client.error(() => `afterAddedToRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } => Could not add user: ${ err }`);
	}

	return involvedUsers;
}

export const definition = {
	hook: 'afterAddedToRoom',
	callback: (roomOwner, room) => Promise.await(afterAddedToRoom(roomOwner, room)),
	id: 'federation-after-added-to-room',
};

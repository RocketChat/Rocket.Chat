import { logger } from '../../logger';
import { isFederated, getFederatedRoomData } from './helpers/federatedResources';
import { FederationRoomEvents, Subscriptions } from '../../../../models/server';
import { Federation } from '../../federation';
import { normalizers } from '../../normalizers';
import { doAfterCreateRoom } from './afterCreateRoom';

async function afterAddedToRoom(involvedUsers, room) {
	console.log('afterAddedToRoom');
	const { user: addedUser } = involvedUsers;

	if (!isFederated(room) && !isFederated(addedUser)) { return; }

	logger.client.debug(() => `afterAddedToRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } room=${ JSON.stringify(room, null, 2) }`);

	// If there are not federated users on this room, ignore it
	const { users, subscriptions } = getFederatedRoomData(room);

	// Load the subscription
	const subscription = Promise.await(Subscriptions.findOneByRoomIdAndUserId(room._id, addedUser._id));

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

			const addUserEvent = await FederationRoomEvents.createAddUserEvent(Federation.domain, room._id, normalizedSourceUser, normalizedSourceSubscription, domainsAfterAdd);

			// Dispatch the events
			Federation.client.dispatchEvent(domainsAfterAdd, addUserEvent);
		}
	} catch (err) {
		// Remove the user subscription from the room
		Promise.await(Subscriptions.remove({ _id: subscription._id }));

		logger.client.error(() => `afterAddedToRoom => involvedUsers=${ JSON.stringify(involvedUsers, null, 2) } => Could not add user: ${ err }`);
	}

	return involvedUsers;
}

export const definition = {
	hook: 'afterAddedToRoom',
	callback: (roomOwner, room) => Promise.await(afterAddedToRoom(roomOwner, room)),
	id: 'federation-after-added-to-room',
};

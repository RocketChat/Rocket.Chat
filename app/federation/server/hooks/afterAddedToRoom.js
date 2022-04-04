import { clientLogger } from '../lib/logger';
import { getFederatedRoomData, hasExternalDomain, isLocalUser, checkRoomType, checkRoomDomainsLength } from '../functions/helpers';
import { FederationRoomEvents, Subscriptions } from '../../../models/server';
import { normalizers } from '../normalizers';
import { doAfterCreateRoom } from './afterCreateRoom';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

async function afterAddedToRoom(involvedUsers, room) {
	const { user: addedUser } = involvedUsers;

	const localDomain = getFederationDomain();

	if (!hasExternalDomain(room) && isLocalUser(addedUser, localDomain)) {
		return involvedUsers;
	}

	clientLogger.debug({ msg: 'afterAddedToRoom', involvedUsers, room });

	// If there are not federated users on this room, ignore it
	const { users, subscriptions } = getFederatedRoomData(room);

	// Load the subscription
	const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, addedUser._id);

	try {
		// If the room is not on the allowed types, ignore
		if (!checkRoomType(room)) {
			throw new Error('Channels cannot be federated');
		}

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
			const domainsAfterAdd = [];
			users.forEach((user) => {
				if (user.hasOwnProperty('federation') && !domainsAfterAdd.includes(user.federation.origin)) {
					domainsAfterAdd.push(user.federation.origin);
				}
			});

			// Check if the number of domains is allowed
			if (!checkRoomDomainsLength(domainsAfterAdd)) {
				throw new Error(`Cannot federate rooms with more than ${process.env.FEDERATED_DOMAINS_LENGTH || 10} domains`);
			}

			//
			// Create the user add event
			//

			const normalizedSourceUser = normalizers.normalizeUser(addedUser);
			const normalizedSourceSubscription = normalizers.normalizeSubscription(subscription);

			const addUserEvent = await FederationRoomEvents.createAddUserEvent(
				localDomain,
				room._id,
				normalizedSourceUser,
				normalizedSourceSubscription,
				domainsAfterAdd,
			);

			// Dispatch the events
			dispatchEvent(domainsAfterAdd, addUserEvent);
		}
	} catch (err) {
		// Remove the user subscription from the room
		Subscriptions.remove({ _id: subscription._id });

		clientLogger.error({ msg: 'afterAddedToRoom => Could not add user:', err });
	}

	return involvedUsers;
}

export const definition = {
	hook: 'afterAddedToRoom',
	callback: (roomOwner, room) => Promise.await(afterAddedToRoom(roomOwner, room)),
	id: 'federation-after-added-to-room',
};

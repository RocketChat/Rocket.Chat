import { FederationRoomEvents, Users, Subscriptions } from '@rocket.chat/models';

import { deleteRoom } from '../../../lib/server/functions/deleteRoom';
import { checkRoomType, checkRoomDomainsLength } from '../functions/helpers';
import { dispatchEvents } from '../handler';
import { getFederationDomain } from '../lib/getFederationDomain';
import { clientLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

export async function doAfterCreateRoom(room, users, subscriptions) {
	const normalizedUsers = [];

	//
	// Add user events
	//
	const addUserEvents = [];

	for await (const user of users) {
		/* eslint-disable no-await-in-loop */

		const subscription = subscriptions[user._id];

		const normalizedSourceUser = await normalizers.normalizeUser(user);
		const normalizedSourceSubscription = normalizers.normalizeSubscription(subscription);

		normalizedUsers.push(normalizedSourceUser);

		const addUserEvent = await FederationRoomEvents.createAddUserEvent(
			getFederationDomain(),
			room._id,
			normalizedSourceUser,
			normalizedSourceSubscription,
		);

		addUserEvents.push(addUserEvent);

		/* eslint-enable no-await-in-loop */
	}

	//
	// Genesis
	//

	// Normalize room
	const normalizedRoom = normalizers.normalizeRoom(room, normalizedUsers);

	// Check if the number of domains is allowed
	if (!checkRoomDomainsLength(normalizedRoom.federation.domains)) {
		throw new Error(`Cannot federate rooms with more than ${process.env.FEDERATED_DOMAINS_LENGTH || 10} domains`);
	}

	// Ensure a genesis event for this room
	const genesisEvent = await FederationRoomEvents.createGenesisEvent(getFederationDomain(), normalizedRoom);

	// Dispatch the events
	await dispatchEvents(normalizedRoom.federation.domains, [genesisEvent, ...addUserEvents]);
}

async function afterCreateRoom(roomOwner, room) {
	// If the room is federated, ignore
	if (room.federation) {
		return roomOwner;
	}

	// Find all subscriptions of this room
	let subscriptions = await Subscriptions.findByRoomIdWhenUsernameExists(room._id).toArray();
	subscriptions = subscriptions.reduce((acc, s) => {
		acc[s.u._id] = s;

		return acc;
	}, {});

	// Get all user ids
	const userIds = Object.keys(subscriptions);

	// Load all the users
	const users = await Users.findUsersWithUsernameByIds(userIds).toArray();

	// Check if there is a federated user on this room
	const hasFederatedUser = users.find((u) => u.username.indexOf('@') !== -1);

	// If there are not federated users on this room, ignore it
	if (!hasFederatedUser) {
		return roomOwner;
	}

	try {
		// If the room is not on the allowed types, ignore
		if (!checkRoomType(room)) {
			throw new Error('Channels cannot be federated');
		}

		clientLogger.debug({ msg: 'afterCreateRoom', roomOwner, room });

		await doAfterCreateRoom(room, users, subscriptions);
	} catch (err) {
		await deleteRoom(room._id);

		clientLogger.error({ msg: 'afterCreateRoom => Could not create federated room:', err });
	}

	return room;
}

export const definition = {
	hook: 'afterCreateRoom',
	callback: afterCreateRoom,
	id: 'federation-after-create-room',
};

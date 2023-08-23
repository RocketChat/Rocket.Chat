import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';

import { subscriptionHasRole } from '../../../authorization/server';

export type SubscribedRoomsForUserWithDetails = {
	rid: string;
	t: string;
	shouldBeRemoved: boolean;
	shouldChangeOwner: boolean;
	userIsLastOwner: boolean;
	newOwner: IUser['_id'] | null;
};

export function shouldRemoveOrChangeOwner(subscribedRooms: SubscribedRoomsForUserWithDetails[]): boolean {
	return subscribedRooms.some(({ shouldBeRemoved, shouldChangeOwner }) => shouldBeRemoved || shouldChangeOwner);
}

export async function getSubscribedRoomsForUserWithDetails(
	userId: string,
	assignNewOwner = true,
	roomIds: string[] = [],
): Promise<SubscribedRoomsForUserWithDetails[]> {
	const subscribedRooms: SubscribedRoomsForUserWithDetails[] = [];

	const cursor =
		roomIds.length > 0 ? Subscriptions.findByUserIdAndRoomIds(userId, roomIds) : Subscriptions.findByUserIdExceptType(userId, 'd');

	// Iterate through all the rooms the user is subscribed to, to check if he is the last owner of any of them.
	for await (const subscription of cursor) {
		const roomData: SubscribedRoomsForUserWithDetails = {
			rid: subscription.rid,
			t: subscription.t,
			shouldBeRemoved: false,
			shouldChangeOwner: false,
			userIsLastOwner: false,
			newOwner: null,
		};

		if (subscriptionHasRole(subscription, 'owner')) {
			// Fetch the number of owners
			const numOwners = await Subscriptions.countByRoomIdAndRoles(subscription.rid, ['owner']);
			// If it's only one, then this user is the only owner.
			roomData.userIsLastOwner = numOwners === 1;
			if (numOwners === 1 && assignNewOwner) {
				// Let's check how many subscribers the room has.
				const options = { projection: { 'u._id': 1 }, sort: { ts: 1 as const } };
				const subscribersCursor = Subscriptions.findByRoomId(subscription.rid, options);

				for await (const {
					u: { _id: uid },
				} of subscribersCursor) {
					// If we already changed the owner or this subscription is for the user we are removing, then don't try to give it ownership
					if (roomData.shouldChangeOwner || uid === userId) {
						continue;
					}
					const newOwner = await Users.findOneActiveById(uid, { projection: { _id: 1 } });
					if (!newOwner) {
						continue;
					}

					roomData.newOwner = uid;
					roomData.shouldChangeOwner = true;
				}

				// If there's no subscriber available to be the new owner and it's not a public room, we can remove it.
				if (!roomData.shouldChangeOwner && roomData.t !== 'c') {
					roomData.shouldBeRemoved = true;
				}
			}
		} else if (roomData.t !== 'c') {
			// If the user is not an owner, remove the room if the user is the only subscriber
			roomData.shouldBeRemoved = (await Subscriptions.countByRoomId(roomData.rid)) === 1;
		}

		subscribedRooms.push(roomData);
	}

	return subscribedRooms;
}

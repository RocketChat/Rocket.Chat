import { subscriptionHasRole } from '../../../authorization/server';
import { Users, Subscriptions, Rooms } from '../../../models/server';

export const getUserSingleOwnedRooms = function(userId) {
	const roomsThatWillChangeOwner = [];
	const roomsThatWillBeRemoved = [];

	// Iterate through all the rooms the user is subscribed to, to check if they are the last owner of any of them.
	Subscriptions.findByUserIdExceptType(userId, 'd').forEach((subscription) => {
		const roomData = {
			rid: subscription.rid,
			t: subscription.t,
		};

		if (subscriptionHasRole(subscription, 'owner')) {
			// Fetch the number of owners
			const numOwners = Subscriptions.findByRoomIdAndRoles(subscription.rid, ['owner']).count();

			// If it's only one, then this user is the only owner.
			if (numOwners === 1) {
				// Let's check how many subscribers the room has.
				const options = { fields: { 'u._id': 1 }, sort: { ts: 1 } };
				const subscribersCursor = Subscriptions.findByRoomId(subscription.rid, options);

				let changedOwner = false;

				subscribersCursor.forEach((subscriber) => {
					if (changedOwner || subscriber.u._id === userId) {
						return;
					}

					const newOwner = Users.findOneActiveById(subscriber.u._id, { fields: { _id: 1 } });
					if (!newOwner) {
						return;
					}

					changedOwner = true;
				});

				if (changedOwner) {
					roomsThatWillChangeOwner.push(roomData.rid);
				} else if (roomData.t !== 'c') {
					// If there's no subscriber available to be the new owner and it's not a public room, we can remove it.
					roomsThatWillBeRemoved.push(roomData.rid);
				}
			}
		} else if (roomData.t !== 'c' && Subscriptions.findByRoomId(roomData.rid).count() === 1) {
			// If the user is not an owner and the room is not public, remove the room if the user is the only subscriber
			roomsThatWillBeRemoved.push(roomData.rid);
		}
	});

	const roomIds = roomsThatWillBeRemoved.concat(roomsThatWillChangeOwner);
	const rooms = Rooms.findByIds(roomIds, { fields: { _id: 1, name: 1, fname: 1 } });

	const result = {
		remove: [],
		changeOwner: [],
	};

	rooms.forEach((room) => {
		const name = room.fname || room.name;
		if (roomsThatWillBeRemoved.includes(room._id)) {
			result.remove.push(name);
		} else {
			result.changeOwner.push(name);
		}
	});

	return result;
};

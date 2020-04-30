import { hasRole, getUsersInRole } from '../../../authorization/server';
import { Users, Subscriptions, Rooms } from '../../../models/server';

export const getUserSingleOwnedRooms = function(userId) {
	const roomsThatWillChangeOwner = [];
	const roomsThatWillBeRemoved = [];

	// Iterate through all the rooms the user is subscribed to, to check if they are the last owner of any of them.
	Subscriptions.db.findByUserId(userId).forEach((subscription) => {
		// DMs don't have owners
		if (subscription.t === 'd') {
			return;
		}

		const roomData = {
			rid: subscription.rid,
			t: subscription.t,
			subscribers: null,
		};

		if (hasRole(userId, 'owner', subscription.rid)) {
			// Fetch the number of owners
			const numOwners = getUsersInRole('owner', subscription.rid).fetch().length;
			// If it's only one, then this user is the only owner.
			if (numOwners === 1) {
				// Let's check how many subscribers the room has.
				const options = { fields: { 'u._id': 1 }, sort: { ts: 1 } };
				const subscribersCursor = Subscriptions.findByRoomId(subscription.rid, options);
				roomData.subscribers = subscribersCursor.count();

				let changedOwner = false;

				subscribersCursor.forEach((subscriber) => {
					if (changedOwner || subscriber.u._id === userId) {
						return false;
					}

					const newOwner = Users.findOneById(subscriber.u._id);
					if (!newOwner || !newOwner.active) {
						return true;
					}

					changedOwner = true;
					return false;
				});

				// If there's no subscriber available to be the new owner, we can remove this room.
				if (!changedOwner) {
					roomsThatWillBeRemoved.push(roomData.rid);
				} else {
					roomsThatWillChangeOwner.push(roomData.rid);
				}
			}
		} else if (Subscriptions.findByRoomId(roomData.rid).count() === 1) {
			// If the user is not an owner, remove the room if the user is the only subscriber
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

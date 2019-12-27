import { hasRole, getUsersInRole, addUserRoles } from '../../../authorization';
import { FileUpload } from '../../../file-upload';
import { Users, Subscriptions, Messages, Rooms } from '../../../models';

export const relinquishRoomOwnerships = function(userId, removeDirectMessages = true) {
	const roomCache = [];

	// Iterate through all the rooms the user is subscribed to, to check if they are the last owner of any of them.
	Subscriptions.db.findByUserId(userId).forEach((subscription) => {
		const roomData = {
			rid: subscription.rid,
			t: subscription.t,
			subscribers: null,
		};

		// If the user is an owner on this room and it's not a DM
		if (roomData.t !== 'd') {
			if (hasRole(userId, 'owner', subscription.rid)) {
				// Fetch the number of owners
				const numOwners = getUsersInRole('owner', subscription.rid).fetch().length;
				// If it's only one, then this user is the only owner.
				if (numOwners === 1) {
					// Let's check how many subscribers the room has.
					const options = { sort: { ts: 1 } };
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

						addUserRoles(subscriber.u._id, 'owner', subscriber.rid);
						changedOwner = true;
						return false;
					});

					// If there's no subscriber available to be the new owner, we can remove this room.
					if (!changedOwner) {
						roomData.remove = true;
					}
				}
			} else {
				// If the user is not an owner, remove the room if the user is the only subscriber
				roomData.remove = Subscriptions.findByRoomId(roomData.rid).count() === 1;
			}
		} else {
			// For DMs, remove or not according to the param
			roomData.remove = removeDirectMessages;
		}

		roomCache.push(roomData);
	});

	roomCache.forEach((roomData) => {
		if (roomData.remove) {
			Subscriptions.removeByRoomId(roomData.rid);
			FileUpload.removeFilesByRoomId(roomData.rid);
			Messages.removeByRoomId(roomData.rid);
			Rooms.removeById(roomData.rid);
		}
	});

	return roomCache;
};

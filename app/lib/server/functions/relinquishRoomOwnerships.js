import { subscriptionHasRole } from '../../../authorization';
import { FileUpload } from '../../../file-upload';
import { Users, Subscriptions, Messages, Rooms, Roles } from '../../../models';

const bulkRoomCleanUp = (rids) => {
	// no bulk deletion for files
	rids.forEach((rid) => FileUpload.removeFilesByRoomId(rid));

	return Promise.await(Promise.all([
		Subscriptions.removeByRoomIds(rids),
		Messages.removeByRoomIds(rids),
		Rooms.removeByIds(rids),
	]));
};

export const relinquishRoomOwnerships = function(userId, removeDirectMessages = true) {
	const roomCache = [];

	// Iterate through all the rooms the user is subscribed to, to check if they are the last owner of any of them.
	Subscriptions.findByUserIdExceptType(userId, 'd').forEach((subscription) => {
		const roomData = {
			rid: subscription.rid,
			t: subscription.t,
			subscribers: null,
		};

		if (subscriptionHasRole(subscription, 'owner')) {
			// Fetch the number of owners
			const numOwners = Subscriptions.findByRoomIdAndRoles(subscription.rid, ['owner']).count();
			// If it's only one, then this user is the only owner.
			if (numOwners === 1) {
				// Let's check how many subscribers the room has.
				const options = { sort: { ts: 1 } };
				const subscribersCursor = Subscriptions.findByRoomId(subscription.rid, options);

				let changedOwner = false;

				subscribersCursor.forEach((subscriber) => {
					// If we already changed the owner or this subscription is for the user we are removing, then don't try to give it ownership
					if (changedOwner || subscriber.u._id === userId) {
						return;
					}

					const newOwner = Users.findOneActiveById(subscriber.u._id, { fields: { _id: 1 } });
					if (!newOwner) {
						return;
					}

					Roles.addUserRoles(subscriber.u._id, ['owner'], subscriber.rid);
					changedOwner = true;
				});

				// If there's no subscriber available to be the new owner and it's not a public room, we can remove it.
				if (!changedOwner && roomData.t !== 'c') {
					roomData.remove = true;
				}
			}
		} else if (roomData.t !== 'c') {
			// If the user is not an owner, remove the room if the user is the only subscriber
			roomData.remove = Subscriptions.findByRoomId(roomData.rid).count() === 1;
		}

		roomCache.push(roomData);
	});

	const roomIds = roomCache.filter((roomData) => roomData.remove).map(({ rid }) => rid);

	if (removeDirectMessages) {
		Rooms.find1On1ByUserId(userId, { fields: { _id: 1 } }).forEach(({ _id }) => roomIds.push(_id));
	}

	bulkRoomCleanUp(roomIds);

	return roomCache;
};

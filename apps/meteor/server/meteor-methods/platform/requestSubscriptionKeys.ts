import { api } from '@rocket.chat/core-services';
import { Subscriptions, Rooms } from '@rocket.chat/models';

export const requestSubscriptionKeysMethod = async (userId: string): Promise<void> => {
	// Get all encrypted rooms that the user is subscribed to and has no E2E key yet
	const subscriptions = await Subscriptions.findByUserIdWithoutE2E(userId).toArray();
	const roomIds = subscriptions.map((subscription) => subscription.rid);

	// For all subscriptions without E2E key, get the rooms that have encryption enabled
	const query = {
		e2eKeyId: {
			$exists: true,
		},
		_id: {
			$in: roomIds,
		},
	};

	const rooms = Rooms.find(query);
	await rooms.forEach((room) => {
		void api.broadcast('notify.e2e.keyRequest', room._id, room.e2eKeyId);
	});
};

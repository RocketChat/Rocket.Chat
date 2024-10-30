import { Subscriptions } from '@rocket.chat/models';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../app/lib/server/lib/notifyListener';

export async function openRoom(userId: string, roomId: string) {
	check(userId, String);
	check(roomId, String);

	if (!roomId) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room');
	}

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const openByRoomResponse = await Subscriptions.openByRoomIdAndUserId(roomId, userId);

	if (openByRoomResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(roomId, userId);
	}

	return openByRoomResponse.modifiedCount;
}

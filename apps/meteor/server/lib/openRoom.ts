import { Subscriptions } from '@rocket.chat/models';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../app/lib/server/lib/notifyListener';

export async function openRoom(userId: string, roomId: string) {
	const openByRoomResponse = await Subscriptions.openByRoomIdAndUserId(roomId, userId);

	if (openByRoomResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(roomId, userId);
	}

	return openByRoomResponse.modifiedCount;
}

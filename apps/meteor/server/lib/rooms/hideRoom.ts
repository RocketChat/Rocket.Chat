import { Subscriptions } from '@rocket.chat/models';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../../app/lib/server/lib/notifyListener';

export async function hideRoomMethod(userId: string, rid: string): Promise<number> {
	check(rid, String);

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const { modifiedCount } = await Subscriptions.hideByRoomIdAndUserId(rid, userId);

	if (modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, userId);
	}

	return modifiedCount;
}

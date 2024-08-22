import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedById } from '../../../lib/server/lib/notifyListener';

export async function handleSuggestedGroupKey(
	handle: 'accept' | 'reject',
	rid: string,
	userId: string | null,
	method: string,
): Promise<void> {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method });
	}

	const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
	if (!sub) {
		throw new Meteor.Error('error-subscription-not-found', 'Subscription not found', { method });
	}

	const suggestedKey = String(sub.E2ESuggestedKey ?? '').trim();
	if (!suggestedKey) {
		throw new Meteor.Error('error-no-suggested-key-available', 'No suggested key available', { method });
	}

	if (handle === 'accept') {
		await Subscriptions.setGroupE2EKey(sub._id, suggestedKey);
		await Rooms.removeUsersFromE2EEQueueByRoomId(sub.rid, [userId]);
	}

	if (handle === 'reject') {
		await Rooms.addUserIdToE2EEQueueByRoomIds([sub.rid], userId);
	}

	const { modifiedCount } = await Subscriptions.unsetGroupE2ESuggestedKey(sub._id);
	if (modifiedCount) {
		void notifyOnSubscriptionChangedById(sub._id);
	}
}

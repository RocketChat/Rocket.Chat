import { Meteor } from 'meteor/meteor';
import { Subscriptions } from '@rocket.chat/models';

Meteor.methods({
	async 'e2e.acceptSuggestedGroupKey'(rid) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.acceptSuggestedGroupKey' });
		}

		const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		if (!sub) {
			throw new Meteor.Error('error-subscription-not-found', 'Subscription not found', { method: 'e2e.acceptSuggestedGroupKey' });
		}

		const suggestedKey = String(sub.E2ESuggestedKey).trim();
		if (!suggestedKey) {
			throw new Meteor.Error('error-no-suggested-key-available', 'No suggested key available', { method: 'e2e.acceptSuggestedGroupKey' });
		}

		await Subscriptions.setGroupE2EKey(sub._id, suggestedKey);

		await Subscriptions.unsetGroupE2ESuggestedKey(sub._id);

		return {
			success: true,
		};
	},
});

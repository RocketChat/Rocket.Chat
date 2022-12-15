import { Meteor } from 'meteor/meteor';
import { Subscriptions } from '@rocket.chat/models';

Meteor.methods({
	async 'e2e.updateGroupKey'(rid, uid, key) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.acceptSuggestedGroupKey' });
		}

		const mySub = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		if (mySub) {
			// I have a subscription to this room
			const userSub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (userSub) {
				// uid also has subscription to this room
				return Subscriptions.setGroupE2ESuggestedKey(userSub._id, key);
			}
		}
	},
});

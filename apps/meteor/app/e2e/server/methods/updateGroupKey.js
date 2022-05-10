import { Meteor } from 'meteor/meteor';

import { Subscriptions } from '../../../models';

Meteor.methods({
	'e2e.updateGroupKey'(rid, uid, key) {
		const mySub = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (mySub) {
			// I have a subscription to this room
			const userSub = Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (userSub) {
				// uid also has subscription to this room
				return Subscriptions.updateGroupE2EKey(userSub._id, key);
			}
		}
	},
});

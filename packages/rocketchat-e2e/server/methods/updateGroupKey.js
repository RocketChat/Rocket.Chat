import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'e2e.updateGroupKey'(rid, uid, key) {
		const mySub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (mySub) { // I have a subscription to this room
			const userSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (userSub) { // uid also has subscription to this room
				return RocketChat.models.Subscriptions.updateGroupE2EKey(userSub._id, key);
			}
		}
	},
});

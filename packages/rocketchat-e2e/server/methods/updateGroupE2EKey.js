Meteor.methods({
	updateGroupE2EKey(rid, uid, key) {
		mySub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (mySub) { // I have a subscription to this room
			userSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (userSub) { // uid also has subscription to this room
				RocketChat.models.Subscriptions.updateGroupE2EKey(userSub._id, key);
			}
		}
	}
});
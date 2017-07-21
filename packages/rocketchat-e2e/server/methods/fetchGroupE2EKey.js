Meteor.methods({
	fetchGroupE2EKey(rid) {
		mySub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (mySub) { // I have a subscription to this room
				return RocketChat.models.Subscriptions.fetchGroupE2EKey(mySub._id);
		}
	}
});
Meteor.methods({
	setLastVisitedRoom(userId, room) {
		Meteor.users.update(userId, { $set: { lastVisitedRoom: room } });
		return true;
	}
});

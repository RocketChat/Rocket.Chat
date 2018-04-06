Meteor.methods({
	setLastVisitedRoom(userId, room) {
		if (typeof(room) === 'string') {
			Meteor.users.update(userId, { $set: { lastVisitedRoom: room } });
			return true;
		}
	}
});

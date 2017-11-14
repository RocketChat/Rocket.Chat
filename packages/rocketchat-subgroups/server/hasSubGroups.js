Meteor.methods({
  hasSubGroups(rid) {
		if (!rid) {
			return false;
		}
    const subs = RocketChat.models.Rooms.find({
      'originalRoomId': rid
    }).count();
    return subs;
	}
});

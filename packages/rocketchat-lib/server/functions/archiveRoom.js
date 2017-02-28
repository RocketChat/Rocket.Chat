RocketChat.archiveRoom = function(rid) {
	RocketChat.models.Rooms.archiveById(rid);
	RocketChat.models.Subscriptions.archiveByRoomId(rid);

	RocketChat.callbacks.run('afterRoomArchived', RocketChat.models.Rooms.findOneById(rid), Meteor.user());
};

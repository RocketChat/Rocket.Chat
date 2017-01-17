RocketChat.Migrations.add({
	version: 80,
	up: function() {
		RocketChat.models.Rooms.find().forEach((room) => {
			RocketChat.models.Rooms.incMsgCountById(room._id, RocketChat.models.Messages.find({ rid: room._id, t: { $exists: true }}).count());
		});
	}
});

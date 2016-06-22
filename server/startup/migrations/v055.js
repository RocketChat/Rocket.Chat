RocketChat.Migrations.add({
	version: 55,
	up: function() {
		RocketChat.models.Rooms.find({ 'topic': { $exists: 1, $ne: '' } }, { topic: 1 }).forEach(function(room) {
			let topic = s.escapeHTML(room.topic);
			RocketChat.models.Rooms.update({ _id: room._id }, { $set: { topic: topic }});
			RocketChat.models.Messages.update({ t: 'room_changed_topic', rid: room._id }, { $set: { msg: topic }});
		});
	}
});

RocketChat.Migrations.add({
	version: 132,
	up() {
		RocketChat.models.Rooms.find({ t: 'l', label: { $exists: true }, fname: { $exists: false } }).forEach(function(room) {
			RocketChat.models.Rooms.update({ _id: room._id }, {
				$set: {
					fname: room.label,
				},
			});
			RocketChat.models.Subscriptions.update({ rid: room._id }, {
				$set: {
					fname: room.label,
				},
			}, { multi: true });
		});
	},
});

RocketChat.Migrations.add({
	version: 77,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Rooms) {
			RocketChat.models.Rooms.find({
				t: 'l',
				'v._id': { $exists: true },
				'v.username': { $exists: false }
			}, { fields: { 'v._id': 1 } }).forEach(function(room) {
				const user = RocketChat.models.Users.findOne({ _id: room.v._id }, { username: 1 });

				if (user && user.username) {
					RocketChat.models.Rooms.update({
						_id: room._id
					}, {
						$set: {
							'v.username': user.username
						}
					});
				}
			});
		}
	}
});


RocketChat.Migrations.add({
	version: 51,
	up() {
		RocketChat.models.Rooms.find({ t: 'l', 'v.token': { $exists: true }, label: { $exists: false }}).forEach(function(room) {
			const user = RocketChat.models.Users.findOne({ 'profile.token': room.v.token });
			if (user) {
				RocketChat.models.Rooms.update({ _id: room._id }, {
					$set: {
						label: user.name || user.username,
						'v._id': user._id
					}
				});
				RocketChat.models.Subscriptions.update({ rid: room._id }, {
					$set: {
						name: user.name || user.username
					}
				}, { multi: true });
			}
		});
	}
});

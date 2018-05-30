RocketChat.Migrations.add({
	version: 122,
	up() {
		RocketChat.models.Rooms.update({
			t: { $ne: 'd' }
		}, {
			$unset: { usernames: 1 }
		}, {
			multi: true
		});

		RocketChat.models.Rooms.find({
			usersCount: { $exists: false }
		}, {
			fields: {
				_id: 1
			}
		}).forEach(({_id}) => {
			const usersCount = RocketChat.models.Subscriptions.findByRoomId(_id).count();

			RocketChat.models.Rooms.update({
				_id
			}, {
				$set: {
					usersCount
				}
			});
		});
	}
});

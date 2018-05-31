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

		RocketChat.models.Subscriptions.find({
			t: 'd',
			name: { $exists: true },
			fname: { $exists: false }
		}, {
			fields: {
				name: 1
			}
		}).forEach(({_id, name}) => {
			const user = RocketChat.models.Users.findOneByUsername(name, {fields: {name: 1}});

			if (!user) {
				return;
			}

			RocketChat.models.Subscriptions.update({
				_id
			}, {
				$set: {
					fname: user.name
				}
			});
		});
	}
});

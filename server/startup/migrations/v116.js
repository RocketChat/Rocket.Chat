RocketChat.Migrations.add({
	version: 116,
	up() {
		const userOptions = {
			fields: {
				_id : 1
			}
		};

		const users = RocketChat.models.Users.model.find({}, userOptions).fetch();
		const userIds = users.map((user) => user._id);

		const subscriptionQuery = {
			'u._id' : {
				'$nin' : userIds
			}
		};

		const subscriptionOptions = {
			fields : {
				_id : 1,
				rid : 1,
				'u._id' : 1
			}
		};

		const subscriptions = RocketChat.models.Subscriptions.find(subscriptionQuery, subscriptionOptions);

		subscriptions.forEach((subscription) => {
			const room = RocketChat.models.Rooms.findOneById(subscription.rid);
			if (room) {
				// If the room is a direct message, remove all subscriptions and messages that it has
				if (room.t === 'd') {
					RocketChat.models.Subscriptions.removeByRoomId(subscription.rid);
					RocketChat.models.Messages.removeByRoomId(subscription.rid);
					RocketChat.models.Rooms.removeById(subscription.rid);
				} else if (room.t !== 'c' && room.usernames.length === 1) {
					// Remove non-channel rooms with only 1 user (the one being deleted)
					RocketChat.models.Rooms.removeById(subscription.rid);
					RocketChat.models.Subscriptions.removeByRoomId(subscription.rid);
				}
			}

			RocketChat.models.Subscriptions.model.remove({ _id: subscription._id.toString() });
		});
	}
});

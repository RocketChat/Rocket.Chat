RocketChat.Migrations.add({
	version: 131,
	up() {
		const userOptions = {
			fields: {
				_id : 1,
			},
		};

		const users = RocketChat.models.Users.model.find({}, userOptions).fetch();
		const userIds = users.map((user) => user._id);

		const subscriptionQuery = {
			'u._id' : {
				$nin : userIds,
			},
		};

		const subscriptionOptions = {
			fields : {
				_id : 1,
				rid : 1,
				'u._id' : 1,
			},
		};

		const subscriptions = RocketChat.models.Subscriptions.find(subscriptionQuery, subscriptionOptions);

		subscriptions.forEach((subscription) => {
			const room = RocketChat.models.Rooms.findOneById(subscription.rid);
			if (room) {
				// Remove direct messages and also non-channel rooms with only 1 user (the one being deleted)
				if (room.t === 'd' || (room.t !== 'c' && RocketChat.models.Subscriptions.findByRoomId(room._id).count() === 1)) {
					RocketChat.models.Subscriptions.removeByRoomId(subscription.rid);
					RocketChat.models.Messages.removeFilesByRoomId(subscription.rid);
					RocketChat.models.Messages.removeByRoomId(subscription.rid);
					RocketChat.models.Rooms.removeById(subscription.rid);
				}
			}

			RocketChat.models.Subscriptions.model.remove({ _id: subscription._id.toString() });
		});
	},
});

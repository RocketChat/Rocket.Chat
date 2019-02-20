import { Migrations } from 'meteor/rocketchat:migrations';
import { Users, Subscriptions, Rooms, Messages } from 'meteor/rocketchat:models';

Migrations.add({
	version: 131,
	up() {
		const userOptions = {
			fields: {
				_id : 1,
			},
		};

		const users = Users.model.find({}, userOptions).fetch();
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

		const subscriptions = Subscriptions.find(subscriptionQuery, subscriptionOptions);

		subscriptions.forEach((subscription) => {
			const room = Rooms.findOneById(subscription.rid);
			if (room) {
				// Remove direct messages and also non-channel rooms with only 1 user (the one being deleted)
				if (room.t === 'd' || (room.t !== 'c' && Subscriptions.findByRoomId(room._id).count() === 1)) {
					Subscriptions.removeByRoomId(subscription.rid);
					Messages.removeFilesByRoomId(subscription.rid);
					Messages.removeByRoomId(subscription.rid);
					Rooms.removeById(subscription.rid);
				}
			}

			Subscriptions.model.remove({ _id: subscription._id.toString() });
		});
	},
});

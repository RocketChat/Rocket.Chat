import { Migrations } from '../../../app/migrations';
import { Subscriptions, Rooms } from '../../../app/models';

Migrations.add({
	version: 183,
	up() {
		const subscriptions = Subscriptions.find({}).fetch();

		subscriptions.forEach((subscription) => {
			const room = Rooms.findOneById(subscription.rid);

			Subscriptions.update({
				_id: subscription._id,
			}, {
				$set: {
					lm: (room.lastMessage && room.lastMessage.ts) || subscription._updatedAt,
				},
			});
		});
	},
});

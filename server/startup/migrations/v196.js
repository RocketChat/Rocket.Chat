import { Migrations } from '../../../app/migrations';
import { Subscriptions, Rooms } from '../../../app/models';

Migrations.add({
	version: 196,
	up() {
		const subscriptions = Subscriptions.find({}).fetch();

		subscriptions.forEach((subscription) => {
			const room = Rooms.findOneById(subscription.rid);

			Subscriptions.update({
				_id: subscription._id,
			}, {
				$set: {
					lm: room.lm || (room.lastMessage && room.lastMessage.ts) || subscription._updatedAt,
				},
			});
		});
	},
});

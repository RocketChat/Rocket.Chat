import { Migrations } from 'meteor/rocketchat:migrations';
import { Rooms, Subscriptions, Messages } from 'meteor/rocketchat:models';

Migrations.add({
	version: 6,
	up() {
		console.log('Changing _id of #general channel room from XXX to GENERAL');

		const room = Rooms.findOneByName('general');

		if (room && room._id !== 'GENERAL') {
			Subscriptions.update({
				rid: room._id,
			}, {
				$set: {
					rid: 'GENERAL',
				},
			}, {
				multi: 1,
			});

			Messages.update({
				rid: room._id,
			}, {
				$set: {
					rid: 'GENERAL',
				},
			}, {
				multi: 1,
			});

			Rooms.removeById(room._id);

			delete room._id;

			Rooms.upsert({
				_id: 'GENERAL',
			}, {
				$set: room,
			});
		}

		return console.log('End');
	},
});

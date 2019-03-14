import { Random } from 'meteor/random';
import { Migrations } from '/app/migrations';
import { Rooms, Subscriptions, Messages } from '/app/models';

Migrations.add({
	version: 4,
	up() {
		Messages.tryDropIndex('rid_1');
		Subscriptions.tryDropIndex('u._id_1');

		console.log('Rename rn to name');

		Subscriptions.update({
			rn: {
				$exists: true,
			},
		}, {
			$rename: {
				rn: 'name',
			},
		}, {
			multi: true,
		});

		console.log('Adding names to rooms without name');

		Rooms.find({
			name: '',
		}).forEach((item) => {
			const name = Random.id().toLowerCase();

			Rooms.setNameById(item._id, name);

			return Subscriptions.update({
				rid: item._id,
			}, {
				$set: {
					name,
				},
			}, {
				multi: true,
			});
		});

		console.log('Making room names unique');

		Rooms.find().forEach(function(room) {

			return Rooms.find({
				name: room.name,
				_id: {
					$ne: room._id,
				},
			}).forEach((item) => {
				const name = `${ room.name }-${ Random.id(2).toLowerCase() }`;

				Rooms.setNameById(item._id, name);

				return Subscriptions.update({
					rid: item._id,
				}, {
					$set: {
						name,
					},
				}, {
					multi: true,
				});
			});
		});

		return console.log('End');
	},
});

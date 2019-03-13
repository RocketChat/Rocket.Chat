import { Migrations } from '/app/migrations';
import { Rooms, Users } from '/app/models';

Migrations.add({
	version: 77,
	up() {
		if (Rooms) {
			Rooms.find({
				t: 'l',
				'v._id': { $exists: true },
				'v.username': { $exists: false },
			}, { fields: { 'v._id': 1 } }).forEach(function(room) {
				const user = Users.findOne({ _id: room.v._id }, { username: 1 });

				if (user && user.username) {
					Rooms.update({
						_id: room._id,
					}, {
						$set: {
							'v.username': user.username,
						},
					});
				}
			});
		}
	},
});


import { Migrations } from '/app/migrations';
import { Users, Rooms, Subscriptions } from '/app/models';

Migrations.add({
	version: 51,
	up() {
		Rooms.find({ t: 'l', 'v.token': { $exists: true }, label: { $exists: false } }).forEach(function(room) {
			const user = Users.findOne({ 'profile.token': room.v.token });
			if (user) {
				Rooms.update({ _id: room._id }, {
					$set: {
						label: user.name || user.username,
						'v._id': user._id,
					},
				});
				Subscriptions.update({ rid: room._id }, {
					$set: {
						name: user.name || user.username,
					},
				}, { multi: true });
			}
		});
	},
});

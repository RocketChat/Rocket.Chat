import { Migrations } from 'meteor/rocketchat:migrations';
import { Rooms, Subscriptions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 132,
	up() {
		Rooms.find({ t: 'l', label: { $exists: true }, fname: { $exists: false } }).forEach(function(room) {
			Rooms.update({ _id: room._id }, {
				$set: {
					fname: room.label,
				},
			});
			Subscriptions.update({ rid: room._id }, {
				$set: {
					fname: room.label,
				},
			}, { multi: true });
		});
	},
});

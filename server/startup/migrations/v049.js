import { Migrations } from '../../../app/migrations';
import { Rooms, Subscriptions, Settings } from '../../../app/models';

Migrations.add({
	version: 49,
	up() {

		let count = 1;

		Rooms.find({ t: 'l' }, { sort: { ts: 1 }, fields: { _id: 1 } }).forEach(function(room) {
			Rooms.update({ _id: room._id }, { $set: { code: count } });
			Subscriptions.update({ rid: room._id }, { $set: { code: count } }, { multi: true });
			count++;
		});

		Settings.upsert({ _id: 'Livechat_Room_Count' }, {
			$set: {
				value: count,
				type: 'int',
				group: 'Livechat',
			},
		});
	},
});

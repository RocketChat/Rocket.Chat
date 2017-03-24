RocketChat.Migrations.add({
	version: 49,
	up() {

		let count = 1;

		RocketChat.models.Rooms.find({ t: 'l' }, { sort: { ts: 1 }, fields: { _id: 1 } }).forEach(function(room) {
			RocketChat.models.Rooms.update({ _id: room._id }, { $set: { code: count } });
			RocketChat.models.Subscriptions.update({ rid: room._id }, { $set: { code: count } }, { multi: true });
			count++;
		});

		RocketChat.models.Settings.upsert({ _id: 'Livechat_Room_Count' }, {
			$set: {
				value: count,
				type: 'int',
				group: 'Livechat'
			}
		});
	}
});

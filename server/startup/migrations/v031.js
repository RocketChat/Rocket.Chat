import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 31,
	up() {
		const changes = {
			API_Analytics: 'GoogleTagManager_id',
		};

		for (const from of Object.keys(changes)) {
			const to = changes[from];
			const record = Settings.findOne({
				_id: from,
			});

			if (record) {
				delete record._id;
				Settings.upsert({
					_id: to,
				}, record);
			}

			Settings.remove({
				_id: from,
			});
		}
	},
});

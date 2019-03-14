import { Migrations } from '/app/migrations';
import { Settings } from '/app/models';

Migrations.add({
	version: 48,
	up() {
		if (Settings) {

			const RocketBot_Enabled = Settings.findOne({
				_id: 'RocketBot_Enabled',
			});
			if (RocketBot_Enabled) {
				Settings.remove({
					_id: 'RocketBot_Enabled',
				});
				Settings.upsert({
					_id: 'InternalHubot_Enabled',
				}, {
					$set: {
						value: RocketBot_Enabled.value,
					},
				});
			}

			const RocketBot_Name = Settings.findOne({
				_id: 'RocketBot_Name',
			});
			if (RocketBot_Name) {
				Settings.remove({
					_id: 'RocketBot_Name',
				});
				Settings.upsert({
					_id: 'InternalHubot_Username',
				}, {
					$set: {
						value: RocketBot_Name.value,
					},
				});
			}

		}
	},
});

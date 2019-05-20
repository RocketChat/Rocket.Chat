import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 145,
	up() {
		const setting = Settings.findOne({ _id: 'Livechat_secret_token' });

		if (setting && setting.value === false) {
			Settings.update({ _id: 'Livechat_secret_token' }, {
				$set: {
					value: '',
				},
			});
		}
	},
});

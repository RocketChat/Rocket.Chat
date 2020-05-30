import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 169,
	up() {
		const _id = 'Livechat_webhookUrl';
		const setting = Settings.findOne({ _id });
		if (setting && setting.value === false) {
			Settings.update({ _id }, {
				$set: {
					value: '',
					packageValue: '',
				},
			});
		}
	},
});

import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 207,
	up() {
		Settings.upsert({
			_id: 'Livechat_show_agent_info',
		}, {
			$set: {
				value: 'name',
			},
		});
	},
});

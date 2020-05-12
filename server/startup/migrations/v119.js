import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 119,
	up() {
		if (Settings) {
			Settings.update({
				_id: 'Show_Setup_Wizard',
				value: true,
			}, {
				$set: { value: 'pending' },
			});

			Settings.update({
				_id: 'Show_Setup_Wizard',
				value: false,
			}, {
				$set: { value: 'completed' },
			});
		}
	},
});

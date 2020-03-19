import {
	Migrations,
} from '../../../app/migrations';
import {
	Settings,
} from '../../../app/models';

Migrations.add({
	version: 172,
	up() {
		const setting = Settings.findOne({ _id: 'Message_SetNameToAliasEnabled' });
		if (setting.value) {
			Settings.update({ _id: 'UI_Use_Real_Name' }, {
				$set: {
					value: true,
				},
			});
		}
		Settings.remove({ _id: 'Message_SetNameToAliasEnabled' });
	},
});

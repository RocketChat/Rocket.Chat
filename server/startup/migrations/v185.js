import {
	Migrations,
} from '../../migrations';
import {
	Settings,
} from '../../../app/models/server';

Migrations.add({
	version: 185,
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

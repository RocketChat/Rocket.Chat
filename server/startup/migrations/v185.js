import { addMigration } from '../../lib/migrations';
import {
	Settings,
} from '../../../app/models/server';

addMigration({
	version: 185,
	up() {
		const setting = Settings.findOne({ _id: 'Message_SetNameToAliasEnabled' });
		if (setting && setting.value) {
			Settings.update({ _id: 'UI_Use_Real_Name' }, {
				$set: {
					value: true,
				},
			});
		}
		Settings.remove({ _id: 'Message_SetNameToAliasEnabled' });
	},
});

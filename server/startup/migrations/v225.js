import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 225,
	up() {
		const hideAvatarsSetting = Settings.findById('Accounts_Default_User_Preferences_hideAvatars');
		Settings.removeById('Accounts_Default_User_Preferences_hideAvatars');
		Settings.upsert({
			_id: 'Accounts_Default_User_Preferences_hideAvatars',
		}, {
			$set: {
				value: !hideAvatarsSetting,
			},
		});
	},
});

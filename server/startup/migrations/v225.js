import { Migrations } from '../../../app/migrations';
import { Settings, Users } from '../../../app/models/server';

Migrations.add({
	version: 225,
	up() {
		const hideAvatarsSetting = Settings.findById('Accounts_Default_User_Preferences_hideAvatars');
		if (hideAvatarsSetting) {
			Settings.removeById('Accounts_Default_User_Preferences_hideAvatars');
			Settings.upsert({
				_id: 'Accounts_Default_User_Preferences_displayAvatars',
			}, {
				$set: {
					value: !hideAvatarsSetting.value,
				},
			});
			Users.update({ 'settings.preferences.hideAvatars': true }, { $set: { 'settings.preferences.displayAvatars': false }, $unset: { 'settings.preferences.hideAvatars': 1 } }, { multi: true });
			Users.update({ 'settings.preferences.hideAvatars': false }, { $set: { 'settings.preferences.displayAvatars': true }, $unset: { 'settings.preferences.hideAvatars': 1 } }, { multi: true });
		}
	},
});

import { Migrations } from '../../../app/migrations';
import { Settings, Users } from '../../../app/models/server';

Migrations.add({
	version: 225,
	up() {
		const hideAvatarsSetting = Settings.findById('Accounts_Default_User_Preferences_hideAvatars');
		const hideAvatarsSidebarSetting = Settings.findById('Accounts_Default_User_Preferences_sidebarHideAvatar');
		Settings.removeById('Accounts_Default_User_Preferences_sidebarHideAvatar');
		Settings.upsert({
			_id: 'Accounts_Default_User_Preferences_sidebarDisplayAvatar',
		}, {
			$set: {
				value: !hideAvatarsSidebarSetting.value,
			},
		});
		Settings.removeById('Accounts_Default_User_Preferences_hideAvatars');
		Settings.upsert({
			_id: 'Accounts_Default_User_Preferences_displayAvatars',
		}, {
			$set: {
				value: !hideAvatarsSetting.value,
			},
		});
		const users = Users.find({}, { fields: { _id: 1, 'settings.preferences': 1 } });
		users.forEach((user) => {
			Users.update(
				{ _id: user._id },
				{
					$set: {
						'settings.preferences.displayAvatars': !user.settings.preferences.hideAvatars,
						'settings.preferences.sidebarDisplayAvatar': !user.settings.preferences.sidebarHideAvatar,
					},
					$unset: {
						'settings.preferences.hideAvatars': 1,
						'settings.preferences.sidebarHideAvatar': 1,
					},
				},
				{ multi: true },
			);
		});
	},
});

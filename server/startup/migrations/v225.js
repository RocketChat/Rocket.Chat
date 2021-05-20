import { Migrations } from '../../../app/migrations';
import { Settings, Users } from '../../../app/models/server';

Migrations.add({
	version: 225,
	up() {
		const hideAvatarsSetting = Settings.findById('Accounts_Default_User_Preferences_hideAvatars');
		const hideAvatarsSidebarSetting = Settings.findById('Accounts_Default_User_Preferences_sidebarHideAvatar');

		Settings.removeById('Accounts_Default_User_Preferences_sidebarShowDiscussion');

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

		const users = Users.find({}, { fields: { _id: 1, 'settings.preferences': 1 } }).fetch();
		users.forEach((user) => {
			if (!(user.settings && user.settings.preferences && typeof user.setting.preferences !== 'object')) {
				return;
			}

			const { preferences } = user.settings;
			const { hideAvatars } = user.settings.preferences;
			const { sidebarHideAvatar } = user.settings.preferences;

			let setValues;
			if (preferences.hasOwnProperty('hideAvatars')) {
				setValues = { 'settings.preferences.displayAvatars': !hideAvatars };
			}

			if (preferences.hasOwnProperty('sidebarHideAvatar')) {
				setValues = { ...setValues, 'settings.preferences.sidebarDisplayAvatar': !sidebarHideAvatar };
			}

			Users.update(
				{ _id: user._id },
				{
					$set: setValues,
					$unset: {
						'settings.preferences.hideAvatars': 1,
						'settings.preferences.sidebarHideAvatar': 1,
						'settings.preferences.sidebarShowDiscussion': 1,
					},
				},
			);
		});
	},
});

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

		Users.update({ 'settings.preferences.hideAvatars': true }, {
			$set: { 'settings.preferences.displayAvatars': false },
			$unset: { 'settings.preferences.hideAvatars': 1 },
		}, { multi: true });

		Users.update({ 'settings.preferences.hideAvatars': false }, {
			$set: { 'settings.preferences.displayAvatars': true },
			$unset: { 'settings.preferences.hideAvatars': 1 },
		}, { multi: true });

		Users.update({ 'settings.preferences.sidebarHideAvatar': true }, {
			$set: { 'settings.preferences.sidebarDisplayAvatar': false },
			$unset: { 'settings.preferences.sidebarHideAvatar': 1 },
		}, { multi: true });

		Users.update({ 'settings.preferences.sidebarHideAvatar': false }, {
			$set: { 'settings.preferences.sidebarDisplayAvatar': true },
			$unset: { 'settings.preferences.sidebarHideAvatar': 1 },
		}, { multi: true });

		Users.update({ 'settings.preferences.sidebarShowDiscussion': { $exists: true } }, {
			$unset: { 'settings.preferences.sidebarShowDiscussion': 1 },
		}, { multi: true });
	},
});

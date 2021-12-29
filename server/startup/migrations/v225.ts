import { addMigration } from '../../lib/migrations';
import { Users } from '../../../app/models/server';
import { Settings } from '../../../app/models/server/raw';

addMigration({
	version: 225,
	async up() {
		const hideAvatarsSetting = await Settings.findOneById('Accounts_Default_User_Preferences_hideAvatars');
		const hideAvatarsSidebarSetting = await Settings.findOneById('Accounts_Default_User_Preferences_sidebarHideAvatar');

		Settings.removeById('Accounts_Default_User_Preferences_sidebarShowDiscussion');

		Settings.removeById('Accounts_Default_User_Preferences_sidebarHideAvatar');
		Settings.update(
			{
				_id: 'Accounts_Default_User_Preferences_sidebarDisplayAvatar',
			},
			{
				$set: {
					value: !hideAvatarsSidebarSetting?.value,
				},
			},
			{
				upsert: true,
			},
		);

		await Settings.removeById('Accounts_Default_User_Preferences_hideAvatars');
		Settings.update(
			{
				_id: 'Accounts_Default_User_Preferences_displayAvatars',
			},
			{
				$set: {
					value: !hideAvatarsSetting?.value,
				},
			},
			{
				upsert: true,
			},
		);

		Users.update(
			{ 'settings.preferences.hideAvatars': true },
			{
				$set: { 'settings.preferences.displayAvatars': false },
				$unset: { 'settings.preferences.hideAvatars': 1 },
			},
			{ multi: true },
		);

		Users.update(
			{ 'settings.preferences.hideAvatars': false },
			{
				$set: { 'settings.preferences.displayAvatars': true },
				$unset: { 'settings.preferences.hideAvatars': 1 },
			},
			{ multi: true },
		);

		Users.update(
			{ 'settings.preferences.sidebarHideAvatar': true },
			{
				$set: { 'settings.preferences.sidebarDisplayAvatar': false },
				$unset: { 'settings.preferences.sidebarHideAvatar': 1 },
			},
			{ multi: true },
		);

		Users.update(
			{ 'settings.preferences.sidebarHideAvatar': false },
			{
				$set: { 'settings.preferences.sidebarDisplayAvatar': true },
				$unset: { 'settings.preferences.sidebarHideAvatar': 1 },
			},
			{ multi: true },
		);

		Users.update(
			{ 'settings.preferences.sidebarShowDiscussion': { $exists: true } },
			{
				$unset: { 'settings.preferences.sidebarShowDiscussion': 1 },
			},
			{ multi: true },
		);
	},
});

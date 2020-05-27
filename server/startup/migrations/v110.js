import { Migrations } from '../../migrations';
import { Settings, Users } from '../../../app/models';

Migrations.add({
	version: 110,
	up() {
		if (Settings) {
			const setting = Settings.findOne({ _id: 'Accounts_Default_User_Preferences_viewMode' });
			if (setting && setting.value) {
				Settings.update(
					{ _id: 'Accounts_Default_User_Preferences_messageViewMode' },
					{ $set: { value: setting.value } },
				);

				Settings.remove(
					{ _id: 'Accounts_Default_User_Preferences_viewMode' },
				);
			}
		}

		if (Users) {
			Users.update(
				{ 'settings.preferences.viewMode': { $exists: 1 } },
				{ $rename: { 'settings.preferences.viewMode': 'user.settings.preferences.messageViewMode' } },
			);
		}
	},
	down() {
		if (Settings) {
			const setting = Settings.findOne({ _id: 'Accounts_Default_User_Preferences_messageViewMode' });
			if (setting && setting.value) {
				Settings.update(
					{ _id: 'Accounts_Default_User_Preferences_viewMode' },
					{ $set: { value: setting.value } },
				);

				Settings.remove(
					{ _id: 'Accounts_Default_User_Preferences_messageViewMode' },
				);
			}
		}

		if (Users) {
			Users.update(
				{ 'settings.preferences.messageViewMode': { $exists: 1 } },
				{ $rename: { 'settings.preferences.messageViewMode': 'user.settings.preferences.viewMode' } },
			);
		}
	},
});

import { Migrations } from '../../../app/migrations';
import { Settings, Users } from '../../../app/models';

Migrations.add({
	version: 112,
	up() {
		if (Settings) {
			const setting = Settings.findOne({ _id: 'Accounts_Default_User_Preferences_idleTimeoutLimit' });
			if (setting && setting.value) {
				Settings.update(
					{ _id: 'Accounts_Default_User_Preferences_idleTimeoutLimit' },
					{ $set: { value: setting.value / 1000 } }
				);
			}
		}

		if (Users) {
			Users.find({ 'settings.preferences.idleTimeLimit': { $exists: 1 } }).forEach(function(user) {
				Users.update(
					{ _id: user._id },
					{ $set: { 'settings.preferences.idleTimeLimit': user.settings.preferences.idleTimeLimit / 1000 } }
				);
			});
		}
	},
});

import { Migrations } from 'meteor/rocketchat:migrations';
import { Users } from 'meteor/rocketchat:models';

Migrations.add({
	version: 54,
	up() {
		if (Users) {
			// Set default message viewMode to 'normal' or 'cozy' depending on the users' current settings and remove the field 'compactView'
			Users.update({ 'settings.preferences.compactView': true }, { $set: { 'settings.preferences.viewMode': 1 }, $unset: { 'settings.preferences.compactView': 1 } }, { multi: true });
			Users.update({ 'settings.preferences.viewMode': { $ne: 1 } }, { $set: { 'settings.preferences.viewMode': 0 } }, { multi: true });
		}
	},
});

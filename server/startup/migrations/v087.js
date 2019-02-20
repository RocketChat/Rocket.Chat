import { Migrations } from 'meteor/rocketchat:migrations';
import { Users } from 'meteor/rocketchat:models';

Migrations.add({
	version: 87,
	up() {
		if (Users) {
			Users.update({ 'settings.preferences.newMessageNotification': false }, { $set: { 'settings.preferences.newMessageNotification': 'none' } }, { multi: true });
			Users.update({ 'settings.preferences.newMessageNotification': true }, { $unset: { 'settings.preferences.newMessageNotification': 1 } }, { multi: true });
			Users.update({ 'settings.preferences.newRoomNotification': false }, { $set: { 'settings.preferences.newRoomNotification': 'none' } }, { multi: true });
			Users.update({ 'settings.preferences.newRoomNotification': true }, { $unset: { 'settings.preferences.newRoomNotification': 1 } }, { multi: true });
		}
	},
});

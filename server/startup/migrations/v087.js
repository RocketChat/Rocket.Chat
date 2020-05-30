import { Migrations } from '../../migrations';
import { Users } from '../../../app/models';

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

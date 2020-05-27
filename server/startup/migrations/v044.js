import { Migrations } from '../../migrations';
import { Users, Settings } from '../../../app/models';

Migrations.add({
	version: 44,
	up() {
		if (Users) {
			Users.find({ $or: [{ 'settings.preferences.disableNewRoomNotification': { $exists: 1 } }, { 'settings.preferences.disableNewMessageNotification': { $exists: 1 } }] }).forEach(function(user) {
				const newRoomNotification = !(user && user.settings && user.settings.preferences && user.settings.preferences.disableNewRoomNotification);
				const newMessageNotification = !(user && user.settings && user.settings.preferences && user.settings.preferences.disableNewMessageNotification);
				Users.update({ _id: user._id }, { $unset: { 'settings.preferences.disableNewRoomNotification': 1, 'settings.preferences.disableNewMessageNotification': 1 }, $set: { 'settings.preferences.newRoomNotification': newRoomNotification, 'settings.preferences.newMessageNotification': newMessageNotification } });
			});
		}

		if (Settings) {
			const optOut = Settings.findOne({ _id: 'Statistics_opt_out' });
			if (optOut) {
				Settings.remove({ _id: 'Statistics_opt_out' });
				Settings.upsert({ _id: 'Statistics_reporting' }, {
					$set: {
						value: !optOut.value,
						i18nDescription: 'Statistics_reporting_Description',
						packageValue: true,
						i18nLabel: 'Statistics_reporting',
					},
				});
			}
		}

		if (Settings) {
			const favoriteRooms = Settings.findOne({ _id: 'Disable_Favorite_Rooms' });
			if (favoriteRooms) {
				Settings.remove({ _id: 'Disable_Favorite_Rooms' });
				Settings.upsert({ _id: 'Favorite_Rooms' }, {
					$set: {
						value: !favoriteRooms.value,
						i18nDescription: 'Favorite_Rooms_Description',
						packageValue: true,
						i18nLabel: 'Favorite_Rooms',
					},
				});
			}
		}
	},
});

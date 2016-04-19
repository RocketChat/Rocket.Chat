RocketChat.Migrations.add({
	version: 44,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Users) {
			RocketChat.models.Users.find({ $or: [ { 'settings.preferences.disableNewRoomNotification': { $exists: 1 } }, { 'settings.preferences.disableNewMessageNotification': { $exists: 1 } } ] }).forEach(function(user) {
				var newRoomNotification = !(user && user.settings && user.settings.preferences && user.settings.preferences.disableNewRoomNotification);
				var newMessageNotification = !(user && user.settings && user.settings.preferences && user.settings.preferences.disableNewMessageNotification);
				RocketChat.models.Users.update({ _id: user._id }, { $unset: { 'settings.preferences.disableNewRoomNotification': 1, 'settings.preferences.disableNewMessageNotification': 1 }, $set: { 'settings.preferences.newRoomNotification': newRoomNotification, 'settings.preferences.newMessageNotification': newMessageNotification } } );
			});
		}

		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			var optOut = RocketChat.models.Settings.findOne({ _id: 'Statistics_opt_out' });
			if (optOut) {
				optOut._id = 'Statistics_reporting';
				optOut.value = !optOut.value ? true : false;
				optOut.i18nDescription = 'Statistics_reporting_Description';
				optOut.packageValue = true;
				optOut.i18nLabel = 'Statistics_reporting';

				RocketChat.models.Settings.remove({ _id: 'Statistics_opt_out' });
				RocketChat.models.Settings.insert(optOut);
			}
		}

		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			var favoriteRooms = RocketChat.models.Settings.findOne({ _id: 'Disable_Favorite_Rooms' });
			if (favoriteRooms) {
				favoriteRooms._id = 'Favorite_Rooms';
				favoriteRooms.value = !favoriteRooms.value ? true : false;
				favoriteRooms.i18nDescription = 'Favorite_Rooms_Description';
				favoriteRooms.packageValue = true;
				favoriteRooms.i18nLabel = 'Favorite_Rooms';

				RocketChat.models.Settings.remove({ _id: 'Disable_Favorite_Rooms' });
				RocketChat.models.Settings.insert(favoriteRooms);
			}
		}
	}
});

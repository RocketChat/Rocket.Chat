RocketChat.Migrations.add({
	version: 105,
	up() {
		if (RocketChat && RocketChat.models) {
			if (RocketChat.models.Users) {
				RocketChat.models.Users.find({ 'settings.preferences.unreadRoomsMode': { $exists: 1 } }).forEach(function(user) {
					const newPreference = user.settings.preferences.unreadRoomsMode ? 'unread' : 'category';
					RocketChat.models.Users.update({ _id: user._id }, { $unset: { 'settings.preferences.unreadRoomsMode': 1 }, $set: { 'settings.preferences.roomsListExhibitionMode': newPreference } });
				});
			}
			if (RocketChat.models.Settings) {
				const settingsMap = {
					'Desktop_Notifications_Default_Alert': 'Accounts_Default_User_Preferences_desktopNotifications',
					'Mobile_Notifications_Default_Alert': 'Accounts_Default_User_Preferences_mobileNotifications',
					'Audio_Notifications_Default_Alert': 'Accounts_Default_User_Preferences_audioNotifications',
					'Desktop_Notifications_Duration': 'Accounts_Default_User_Preferences_desktopNotificationDuration',
					'Audio_Notifications_Value': undefined
				};
				RocketChat.models.Settings.find({ _id: { $in: Object.keys(settingsMap) }}).forEach(oldSetting => {
					const newSettingKey = settingsMap[oldSetting._id];
					const newSetting = newSettingKey && RocketChat.models.Settings.findOne({ _id: newSettingKey });

					if (newSetting && newSetting.value !== oldSetting.value) {
						RocketChat.models.Settings.update({ _id: newSettingKey }, {	$set: {	value: oldSetting.value	}	});
					}
					RocketChat.models.Settings.remove({_id: oldSetting._id });
				});
			}
		}
	}
});

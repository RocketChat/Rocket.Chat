import { Migrations } from 'meteor/rocketchat:migrations';
import { Users, Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 105,
	up() {
		if (Users) {
			Users.find({ 'settings.preferences.unreadRoomsMode': { $exists: 1 } }).forEach(function(user) {
				const newPreference = user.settings.preferences.unreadRoomsMode ? 'unread' : 'category';
				Users.update({ _id: user._id }, { $unset: { 'settings.preferences.unreadRoomsMode': 1 }, $set: { 'settings.preferences.roomsListExhibitionMode': newPreference } });
			});
		}
		if (Settings) {
			const settingsMap = {
				Desktop_Notifications_Default_Alert: 'Accounts_Default_User_Preferences_desktopNotifications',
				Mobile_Notifications_Default_Alert: 'Accounts_Default_User_Preferences_mobileNotifications',
				Audio_Notifications_Default_Alert: 'Accounts_Default_User_Preferences_audioNotifications',
				Desktop_Notifications_Duration: 'Accounts_Default_User_Preferences_desktopNotificationDuration',
				Audio_Notifications_Value: undefined,
			};
			Settings.find({ _id: { $in: Object.keys(settingsMap) } }).forEach((oldSetting) => {
				const newSettingKey = settingsMap[oldSetting._id];
				const newSetting = newSettingKey && Settings.findOne({ _id: newSettingKey });

				if (newSetting && newSetting.value !== oldSetting.value) {
					Settings.update({ _id: newSettingKey }, { $set: { value: oldSetting.value } });
				}
				Settings.remove({ _id: oldSetting._id });
			});
		}
	},
});

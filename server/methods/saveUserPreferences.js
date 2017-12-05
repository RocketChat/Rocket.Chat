Meteor.methods({
	saveUserPreferences(settings) {
		check(settings, Object);

		if (Meteor.userId()) {
			const preferences = {};

			if (settings.language != null) {
				RocketChat.models.Users.setLanguage(Meteor.userId(), settings.language);
			}

			if (settings.newRoomNotification) {
				preferences.newRoomNotification = settings.newRoomNotification;
			}

			if (settings.newMessageNotification) {
				preferences.newMessageNotification = settings.newMessageNotification;
			}

			if (settings.useEmojis) {
				preferences.useEmojis = settings.useEmojis === '1' ? true : false;
			}

			if (settings.convertAsciiEmoji) {
				preferences.convertAsciiEmoji = settings.convertAsciiEmoji === '1' ? true : false;
			}

			if (settings.saveMobileBandwidth) {
				preferences.saveMobileBandwidth = settings.saveMobileBandwidth === '1' ? true : false;
			}

			if (settings.collapseMediaByDefault) {
				preferences.collapseMediaByDefault = settings.collapseMediaByDefault === '1' ? true : false;
			}

			if (settings.unreadRoomsMode) {
				preferences.unreadRoomsMode = settings.unreadRoomsMode === '1' ? true : false;
			}

			if (settings.autoImageLoad) {
				preferences.autoImageLoad = settings.autoImageLoad === '1' ? true : false;
			}

			if (settings.emailNotificationMode) {
				preferences.emailNotificationMode = settings.emailNotificationMode;
			}

			if (settings.mergeChannels !== '-1') {
				preferences.mergeChannels = settings.mergeChannels === '1';
			} else {
				delete preferences.mergeChannels;
			}
			if (settings.unreadRoomsMode) {
				preferences.unreadRoomsMode = settings.unreadRoomsMode === '1' ? true : false;
			}

			preferences.roomsListExhibitionMode = ['category', 'unread', 'activity'].includes(settings.roomsListExhibitionMode) ? settings.roomsListExhibitionMode : 'category';
			if (settings.unreadAlert) {
				preferences.unreadAlert = settings.unreadAlert === '1' ? true : false;
			}

			if (settings.notificationsSoundVolume) {
				preferences.notificationsSoundVolume = settings.notificationsSoundVolume;
			}

			if (settings.audioNotifications) {
				preferences.audioNotifications = settings.audioNotifications;
			}
			if (settings.desktopNotifications) {
				preferences.desktopNotifications = settings.desktopNotifications;
			}
			if (settings.mobileNotifications) {
				preferences.mobileNotifications = settings.mobileNotifications;
			}
			if (settings.idleTimeLimit) {
				preferences.idleTimeLimit = settings.idleTimeLimit;
			}

			preferences.enableAutoAway = settings.enableAutoAway === '1';

			preferences.audioNotificationValue = settings.audioNotificationValue - 0;
			preferences.desktopNotificationDuration = settings.desktopNotificationDuration - 0;
			preferences.viewMode = settings.viewMode || 0;
			preferences.hideUsernames = settings.hideUsernames === '1';
			preferences.hideRoles = settings.hideRoles === '1';
			preferences.hideAvatars = settings.hideAvatars === '1';
			preferences.hideFlexTab = settings.hideFlexTab === '1';
			preferences.highlights = settings.highlights;
			preferences.sendOnEnter = settings.sendOnEnter;
			preferences.roomCounterSidebar = settings.roomCounterSidebar === '1';

			RocketChat.models.Users.setPreferences(Meteor.userId(), preferences);

			return true;
		}
	}
});

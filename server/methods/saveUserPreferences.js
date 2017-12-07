import moment from 'moment';

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

			if (settings.snoozeNotificationsDuration && settings.snoozeNotificationsDuration > 0) {
				const initialDateTime = new Date();

				preferences.snoozeNotifications = {
					duration: settings.snoozeNotificationsDuration,
					initialDateTime,
					finalDateTime: (moment(initialDateTime).add(settings.snoozeNotificationsDuration, 'minutes')).toDate()
				};
			} else {
				preferences.snoozeNotifications = {};
			}

			if (settings.doNotDisturbInitialTime && settings.doNotDisturbFinalTime) {
				preferences.doNotDisturb = {
					initialTime: settings.doNotDisturbInitialTime,
					finalTime: settings.doNotDisturbFinalTime,
					repeatFor: settings.doNotDisturbRepeatFor
				};

				if (preferences.doNotDisturb.repeatFor && preferences.doNotDisturb.repeatFor !== '') {
					const addLimitDateTime = (durationValue, durationType) => {
						return preferences.doNotDisturb.limitDateTime = moment(`${ moment().format('YYYY-MM-DD') } ${ preferences.doNotDisturb.finalTime }`, 'YYYY-MM-DD HH:mm').add(durationValue, durationType).toDate();
					};

					switch (preferences.doNotDisturb.repeatFor) {
						case '1 day': addLimitDateTime(1, 'day'); break;
						case '1 week': addLimitDateTime(1, 'week'); break;
						case '1 month': addLimitDateTime(1, 'month'); break;
						case '1 year': addLimitDateTime(1, 'year'); break;
						case 'every day': preferences.doNotDisturb.limitDateTime = undefined;
					}
				}
			} else {
				preferences.doNotDisturb = {};
			}

			RocketChat.models.Users.setPreferences(Meteor.userId(), preferences);

			return true;
		}
	}
});

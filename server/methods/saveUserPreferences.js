Meteor.methods({
	saveUserPreferences(settings) {
		check(settings, Match.ObjectIncluding({
			language: Match.Optional(String),
			newRoomNotification: Match.Optional(String),
			newMessageNotification: Match.Optional(String),
			useEmojis: Match.Optional(Boolean),
			convertAsciiEmoji: Match.Optional(Boolean),
			saveMobileBandwidth: Match.Optional(Boolean),
			collapseMediaByDefault: Match.Optional(Boolean),
			autoImageLoad: Match.Optional(Boolean),
			emailNotificationMode: Match.Optional(String),
			roomsListExhibitionMode: Match.Optional(String),
			unreadAlert: Match.Optional(Boolean),
			notificationsSoundVolume: Match.Optional(Number),
			desktopNotifications: Match.Optional(String),
			mobileNotifications: Match.Optional(String),
			enableAutoAway: Match.Optional(Boolean),
			highlights: [String],
			desktopNotificationDuration: Match.Optional(Number),
			viewMode: Match.Optional(Number),
			hideUsernames: Match.Optional(Boolean),
			hideRoles: Match.Optional(Boolean),
			hideAvatars: Match.Optional(Boolean),
			hideFlexTab: Match.Optional(Boolean),
			sendOnEnter: Match.Optional(String),
			roomCounterSidebar: Match.Optional(Boolean),
			mergeChannels: Match.Optional(Number),
			idleTimeLimit: Match.Optional(Number)
		}));

		if (Meteor.userId()) {
			if (settings.language != null) {
				RocketChat.models.Users.setLanguage(Meteor.userId(), settings.language);
			}

			if (settings.mergeChannels !== -1) {
				settings.mergeChannels = settings.mergeChannels === '1';
			} else {
				delete settings.mergeChannels;
			}

			settings.roomsListExhibitionMode = ['category', 'unread', 'activity'].includes(settings.roomsListExhibitionMode) ? settings.roomsListExhibitionMode : 'category';

			RocketChat.models.Users.setPreferences(Meteor.userId(), settings);

			return true;
		}
	}
});

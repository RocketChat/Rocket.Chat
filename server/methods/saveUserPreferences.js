Meteor.methods({
	saveUserPreferences(settings) {
		const keys = {
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
			highlights: Match.Optional([String]),
			desktopNotificationDuration: Match.Optional(Number),
			viewMode: Match.Optional(Number),
			hideUsernames: Match.Optional(Boolean),
			hideRoles: Match.Optional(Boolean),
			hideAvatars: Match.Optional(Boolean),
			hideFlexTab: Match.Optional(Boolean),
			sendOnEnter: Match.Optional(String),
			roomCounterSidebar: Match.Optional(Boolean),
			idleTimeLimit: Match.Optional(Number),
			sidebarShowFavorites: Match.Optional(Boolean),
			sidebarShowUnread: Match.Optional(Boolean),
			sidebarSortby: Match.Optional(String),
			sidebarViewMode: Match.Optional(String),
			sidebarHideAvatar: Match.Optional(Boolean),
			muteFocusedConversations: Match.Optional(Boolean)
		};
		check(settings, Match.ObjectIncluding(keys));
		if (settings.mergeChannels) {
			check(settings, Match.ObjectIncluding({
				mergeChannels: Match.OneOf(Number, Boolean) //eslint-disable-line new-cap
			}));
		}
		const user = Meteor.userId();
		if (!user) {
			return false;
		}

		if (settings.language != null) {
			RocketChat.models.Users.setLanguage(user, settings.language);
		}

		if (settings.mergeChannels != null) {
			settings.mergeChannels = ['1', true].includes(settings.mergeChannels);
		}



		if (settings.roomsListExhibitionMode != null) {
			settings.roomsListExhibitionMode = ['category', 'unread', 'activity'].includes(settings.roomsListExhibitionMode) ? settings.roomsListExhibitionMode : 'category';
		}

		RocketChat.models.Users.setPreferences(user, settings);

		return true;
	}
});

function trackEvent(category, action, label) {
	if (window._paq) {
		window._paq.push(['trackEvent', category, action, label]);
	}
	if (window.ga) {
		window.ga('send', 'event', category, action, label);
	}
}

if (!window._paq || window.ga) {
	//Trigger the trackPageView manually as the page views don't seem to be tracked
	FlowRouter.triggers.enter([(route) => {
		if (window._paq) {
			const http = location.protocol;
			const slashes = http.concat('//');
			const host = slashes.concat(window.location.hostname);
			window._paq.push(['setCustomUrl', host + route.path]);
			window._paq.push(['trackPageView']);
		}
		if (window.ga) {
			window.ga('send', 'pageview', route.path);
		}
	}]);

	//Login page has manual switches
	RocketChat.callbacks.add('loginPageStateChange', (state) => {
		trackEvent('Navigation', 'Login Page State Change', state);
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-login-state-change');

	//Messsages
	RocketChat.callbacks.add('afterSaveMessage', (message) => {
		if ((window._paq || window.ga) && RocketChat.settings.get('Analytics_features_messages')) {
			const room = ChatRoom.findOne({ _id: message.rid });
			trackEvent('Message', 'Send', room.name + ' (' + room._id + ')');
		}
	}, 2000, 'trackEvents');

	//Rooms
	RocketChat.callbacks.add('afterCreateChannel', (owner, room) => {
		if (RocketChat.settings.get('Analytics_features_rooms')) {
			trackEvent('Room', 'Create', room.name + ' (' + room._id + ')');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-after-create-channel');

	RocketChat.callbacks.add('roomNameChanged', (room) => {
		if (RocketChat.settings.get('Analytics_features_rooms')) {
			trackEvent('Room', 'Changed Name', room.name + ' (' + room._id + ')');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-room-name-changed');

	RocketChat.callbacks.add('roomTopicChanged', (room) => {
		if (RocketChat.settings.get('Analytics_features_rooms')) {
			trackEvent('Room', 'Changed Topic', room.name + ' (' + room._id + ')');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-room-topic-changed');

	RocketChat.callbacks.add('roomAnnouncementChanged', (room) => {
		if (RocketChat.settings.get('Analytics_features_rooms')) {
			trackEvent('Room', 'Changed Announcement', room.name + ' (' + room._id + ')');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-room-announcement-changed');

	RocketChat.callbacks.add('roomTypeChanged', (room) => {
		if (RocketChat.settings.get('Analytics_features_rooms')) {
			trackEvent('Room', 'Changed Room Type', room.name + ' (' + room._id + ')');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-room-type-changed');

	RocketChat.callbacks.add('archiveRoom', (room) => {
		if (RocketChat.settings.get('Analytics_features_rooms')) {
			trackEvent('Room', 'Archived', room.name + ' (' + room._id + ')');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-archive-room');

	RocketChat.callbacks.add('unarchiveRoom', (room) => {
		if (RocketChat.settings.get('Analytics_features_rooms')) {
			trackEvent('Room', 'Unarchived', room.name + ' (' + room._id + ')');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-unarchive-room');

	//Users
	//Track logins and associate user ids with piwik
	(() => {
		let oldUserId = null;

		Meteor.autorun(() => {
			const newUserId = Meteor.userId();
			if (oldUserId === null && newUserId) {
				if (window._paq && RocketChat.settings.get('Analytics_features_users')) {
					trackEvent('User', 'Login', newUserId);
					window._paq.push(['setUserId', newUserId]);
				}
			} else if (newUserId === null && oldUserId) {
				if (window._paq && RocketChat.settings.get('Analytics_features_users')) {
					trackEvent('User', 'Logout', oldUserId);
				}
			}
			oldUserId = Meteor.userId();
		});
	})();

	RocketChat.callbacks.add('userRegistered', () => {
		if (RocketChat.settings.get('Analytics_features_users')) {
			trackEvent('User', 'Registered');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'piwik-user-resitered');

	RocketChat.callbacks.add('usernameSet', () => {
		if (RocketChat.settings.get('Analytics_features_users')) {
			trackEvent('User', 'Username Set');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'piweik-username-set');

	RocketChat.callbacks.add('userPasswordReset', () => {
		if (RocketChat.settings.get('Analytics_features_users')) {
			trackEvent('User', 'Reset Password');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'piwik-user-password-reset');

	RocketChat.callbacks.add('userConfirmationEmailRequested', () => {
		if (RocketChat.settings.get('Analytics_features_users')) {
			trackEvent('User', 'Confirmation Email Requested');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'piwik-user-confirmation-email-requested');

	RocketChat.callbacks.add('userForgotPasswordEmailRequested', () => {
		if (RocketChat.settings.get('Analytics_features_users')) {
			trackEvent('User', 'Forgot Password Email Requested');
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'piwik-user-forgot-password-email-requested');

	RocketChat.callbacks.add('userStatusManuallySet', (status) => {
		if (RocketChat.settings.get('Analytics_features_users')) {
			trackEvent('User', 'Status Manually Changed', status);
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-user-status-manually-set');

	RocketChat.callbacks.add('userAvatarSet', (service) => {
		if (RocketChat.settings.get('Analytics_features_users')) {
			trackEvent('User', 'Avatar Changed', service);
		}
	}, RocketChat.callbacks.priority.MEDIUM, 'analytics-user-avatar-set');
}

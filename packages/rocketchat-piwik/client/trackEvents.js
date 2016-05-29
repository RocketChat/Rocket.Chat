//Trigger the trackPageView manually as the page views don't seem to be tracked
FlowRouter.triggers.enter([function updatePiwik(route) {
	if (window._paq) {
		let http = location.protocol;
		let slashes = http.concat('//');
		let host = slashes.concat(window.location.hostname);

		window._paq.push(['setCustomUrl', host + route.path]);
		window._paq.push(['trackPageView']);
	}
}]);

//Login page has manual switches
RocketChat.callbacks.add('loginPageStateChange', (state) => {
	if (window._paq) {
		window._paq.push(['trackEvent', 'Navigation', 'Login Page State Change', state]);
	}
});

//Messsages
RocketChat.callbacks.add('afterSaveMessage', (message) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_messages')) {
		let room = ChatRoom.findOne({ _id: message.rid });
		window._paq.push(['trackEvent', 'Message', 'Send', room.name + ' (' + room._id + ')' ]);
	}
}, 2000);

//Rooms
RocketChat.callbacks.add('afterCreateChannel', (room) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_rooms')) {
		window._paq.push(['trackEvent', 'Room', 'Create', room.name + ' (' + room._id + ')' ]);
	}
});

RocketChat.callbacks.add('roomNameChanged', (room) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_rooms')) {
		window._paq.push(['trackEvent', 'Room', 'Changed Name', room.name + ' (' + room._id + ')' ]);
	}
});

RocketChat.callbacks.add('roomTopicChanged', (room) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_rooms')) {
		window._paq.push(['trackEvent', 'Room', 'Changed Topic', room.name + ' (' + room._id + ')' ]);
	}
});

RocketChat.callbacks.add('roomTypeChanged', (room) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_rooms')) {
		window._paq.push(['trackEvent', 'Room', 'Changed Room Type', room.name + ' (' + room._id + ')' ]);
	}
});

RocketChat.callbacks.add('archiveRoom', (room) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_rooms')) {
		window._paq.push(['trackEvent', 'Room', 'Archived', room.name + ' (' + room._id + ')' ]);
	}
});

RocketChat.callbacks.add('unarchiveRoom', (room) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_rooms')) {
		window._paq.push(['trackEvent', 'Room', 'Unarchived', room.name + ' (' + room._id + ')' ]);
	}
});

//Users
//Track logins and associate user ids with piwik
(() => {
	let oldUserId = null;

	Meteor.autorun(() => {
		let newUserId = Meteor.userId();
		if (oldUserId === null && newUserId) {
			if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
				window._paq.push(['trackEvent', 'User', 'Login', newUserId ]);
				window._paq.push(['setUserId', newUserId]);
			}
		} else if (newUserId === null && oldUserId) {
			if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
				window._paq.push(['trackEvent', 'User', 'Logout', oldUserId ]);
			}
		}
		oldUserId = Meteor.userId();
	});
})();

RocketChat.callbacks.add('userRegistered', () => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
		window._paq.push(['trackEvent', 'User', 'Registered']);
	}
});

RocketChat.callbacks.add('usernameSet', () => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
		window._paq.push(['trackEvent', 'User', 'Username Set']);
	}
});

RocketChat.callbacks.add('userPasswordReset', () => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
		window._paq.push(['trackEvent', 'User', 'Reset Password']);
	}
});

RocketChat.callbacks.add('userConfirmationEmailRequested', () => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
		window._paq.push(['trackEvent', 'User', 'Confirmation Email Requested']);
	}
});

RocketChat.callbacks.add('userForgotPasswordEmailRequested', () => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
		window._paq.push(['trackEvent', 'User', 'Forgot Password Email Requested']);
	}
});

RocketChat.callbacks.add('userStatusManuallySet', (status) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
		window._paq.push(['trackEvent', 'User', 'Status Manually Changed', status]);
	}
});

RocketChat.callbacks.add('userAvatarSet', (service) => {
	if (window._paq && RocketChat.settings.get('PiwikAnalytics_features_users')) {
		window._paq.push(['trackEvent', 'User', 'Avatar Changed', service]);
	}
});

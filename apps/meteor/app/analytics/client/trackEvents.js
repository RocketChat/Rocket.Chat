import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { callbacks } from '../../../lib/callbacks';
import { ChatRoom } from '../../models';

function trackEvent(category, action, label) {
	if (window._paq) {
		window._paq.push(['trackEvent', category, action, label]);
	}
	if (window.ga) {
		window.ga('send', 'event', category, action, label);
	}
}

if (!window._paq || window.ga) {
	// Trigger the trackPageView manually as the page views are only loaded when the loadScript.js code is executed
	FlowRouter.triggers.enter([
		(route) => {
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
		},
	]);

	// Login page has manual switches
	callbacks.add(
		'loginPageStateChange',
		(state) => {
			trackEvent('Navigation', 'Login Page State Change', state);
		},
		callbacks.priority.MEDIUM,
		'analytics-login-state-change',
	);

	// Messsages
	callbacks.add(
		'afterSaveMessage',
		(message) => {
			if ((window._paq || window.ga) && settings.get('Analytics_features_messages')) {
				const room = ChatRoom.findOne({ _id: message.rid });
				trackEvent('Message', 'Send', `${room.name} (${room._id})`);
			}
		},
		2000,
		'trackEvents',
	);

	// Rooms
	callbacks.add(
		'afterCreateChannel',
		(owner, room) => {
			if (settings.get('Analytics_features_rooms')) {
				trackEvent('Room', 'Create', `${room.name} (${room._id})`);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-after-create-channel',
	);

	callbacks.add(
		'roomNameChanged',
		(room) => {
			if (settings.get('Analytics_features_rooms')) {
				trackEvent('Room', 'Changed Name', `${room.name} (${room._id})`);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-room-name-changed',
	);

	callbacks.add(
		'roomTopicChanged',
		(room) => {
			if (settings.get('Analytics_features_rooms')) {
				trackEvent('Room', 'Changed Topic', `${room.name} (${room._id})`);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-room-topic-changed',
	);

	callbacks.add(
		'roomAnnouncementChanged',
		(room) => {
			if (settings.get('Analytics_features_rooms')) {
				trackEvent('Room', 'Changed Announcement', `${room.name} (${room._id})`);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-room-announcement-changed',
	);

	callbacks.add(
		'roomTypeChanged',
		(room) => {
			if (settings.get('Analytics_features_rooms')) {
				trackEvent('Room', 'Changed Room Type', `${room.name} (${room._id})`);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-room-type-changed',
	);

	callbacks.add(
		'archiveRoom',
		(room) => {
			if (settings.get('Analytics_features_rooms')) {
				trackEvent('Room', 'Archived', `${room.name} (${room._id})`);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-archive-room',
	);

	callbacks.add(
		'unarchiveRoom',
		(room) => {
			if (settings.get('Analytics_features_rooms')) {
				trackEvent('Room', 'Unarchived', `${room.name} (${room._id})`);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-unarchive-room',
	);

	// Users
	// Track logins and associate user ids with piwik
	(() => {
		let oldUserId = null;

		Tracker.autorun(() => {
			const newUserId = Meteor.userId();
			if (oldUserId === null && newUserId) {
				if (window._paq && settings.get('Analytics_features_users')) {
					trackEvent('User', 'Login', newUserId);
					window._paq.push(['setUserId', newUserId]);
				}
			} else if (newUserId === null && oldUserId) {
				if (window._paq && settings.get('Analytics_features_users')) {
					trackEvent('User', 'Logout', oldUserId);
				}
			}
			oldUserId = Meteor.userId();
		});
	})();

	callbacks.add(
		'userRegistered',
		() => {
			if (settings.get('Analytics_features_users')) {
				trackEvent('User', 'Registered');
			}
		},
		callbacks.priority.MEDIUM,
		'piwik-user-resitered',
	);

	callbacks.add(
		'usernameSet',
		() => {
			if (settings.get('Analytics_features_users')) {
				trackEvent('User', 'Username Set');
			}
		},
		callbacks.priority.MEDIUM,
		'piweik-username-set',
	);

	callbacks.add(
		'userPasswordReset',
		() => {
			if (settings.get('Analytics_features_users')) {
				trackEvent('User', 'Reset Password');
			}
		},
		callbacks.priority.MEDIUM,
		'piwik-user-password-reset',
	);

	callbacks.add(
		'userConfirmationEmailRequested',
		() => {
			if (settings.get('Analytics_features_users')) {
				trackEvent('User', 'Confirmation Email Requested');
			}
		},
		callbacks.priority.MEDIUM,
		'piwik-user-confirmation-email-requested',
	);

	callbacks.add(
		'userForgotPasswordEmailRequested',
		() => {
			if (settings.get('Analytics_features_users')) {
				trackEvent('User', 'Forgot Password Email Requested');
			}
		},
		callbacks.priority.MEDIUM,
		'piwik-user-forgot-password-email-requested',
	);

	callbacks.add(
		'userStatusManuallySet',
		(status) => {
			if (settings.get('Analytics_features_users')) {
				trackEvent('User', 'Status Manually Changed', status);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-user-status-manually-set',
	);

	callbacks.add(
		'userAvatarSet',
		(service) => {
			if (settings.get('Analytics_features_users')) {
				trackEvent('User', 'Avatar Changed', service);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-user-avatar-set',
	);

	callbacks.add(
		'roomAvatarChanged',
		(room) => {
			if (settings.get('Analytics_features_rooms')) {
				trackEvent('Room', 'Changed Avatar', `${room.name} (${room._id})`);
			}
		},
		callbacks.priority.MEDIUM,
		'analytics-room-avatar-changed',
	);
}

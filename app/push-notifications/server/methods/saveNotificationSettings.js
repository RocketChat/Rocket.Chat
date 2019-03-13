import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Subscriptions } from '/app/models';
import { getUserNotificationPreference } from '/app/utils';

Meteor.methods({
	saveNotificationSettings(roomId, field, value) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveNotificationSettings' });
		}
		check(roomId, String);
		check(field, String);
		check(value, String);

		const notifications = {
			audioNotifications: {
				updateMethod: (subscription, value) => Subscriptions.updateAudioNotificationsById(subscription._id, value),
			},
			desktopNotifications: {
				updateMethod: (subscription, value) => {
					if (value === 'default') {
						const userPref = getUserNotificationPreference(Meteor.userId(), 'desktop');
						Subscriptions.updateDesktopNotificationsById(subscription._id, userPref.origin === 'server' ? null : userPref);
					} else {
						Subscriptions.updateDesktopNotificationsById(subscription._id, { value, origin: 'subscription' });
					}
				},
			},
			mobilePushNotifications: {
				updateMethod: (subscription, value) => {
					if (value === 'default') {
						const userPref = getUserNotificationPreference(Meteor.userId(), 'mobile');
						Subscriptions.updateMobilePushNotificationsById(subscription._id, userPref.origin === 'server' ? null : userPref);
					} else {
						Subscriptions.updateMobilePushNotificationsById(subscription._id, { value, origin: 'subscription' });
					}
				},
			},
			emailNotifications: {
				updateMethod: (subscription, value) => {
					if (value === 'default') {
						const userPref = getUserNotificationPreference(Meteor.userId(), 'email');
						Subscriptions.updateEmailNotificationsById(subscription._id, userPref.origin === 'server' ? null : userPref);
					} else {
						Subscriptions.updateEmailNotificationsById(subscription._id, { value, origin: 'subscription' });
					}
				},
			},
			unreadAlert: {
				updateMethod: (subscription, value) => Subscriptions.updateUnreadAlertById(subscription._id, value),
			},
			disableNotifications: {
				updateMethod: (subscription, value) => Subscriptions.updateDisableNotificationsById(subscription._id, value === '1'),
			},
			hideUnreadStatus: {
				updateMethod: (subscription, value) => Subscriptions.updateHideUnreadStatusById(subscription._id, value === '1'),
			},
			muteGroupMentions: {
				updateMethod: (subscription, value) => Subscriptions.updateMuteGroupMentions(subscription._id, value === '1'),
			},
			desktopNotificationDuration: {
				updateMethod: (subscription, value) => Subscriptions.updateDesktopNotificationDurationById(subscription._id, value),
			},
			audioNotificationValue: {
				updateMethod: (subscription, value) => Subscriptions.updateAudioNotificationValueById(subscription._id, value),
			},
		};
		const isInvalidNotification = !Object.keys(notifications).includes(field);
		const basicValuesForNotifications = ['all', 'mentions', 'nothing', 'default'];
		const fieldsMustHaveBasicValues = ['emailNotifications', 'audioNotifications', 'mobilePushNotifications', 'desktopNotifications'];

		if (isInvalidNotification) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', { method: 'saveNotificationSettings' });
		}

		if (fieldsMustHaveBasicValues.includes(field) && !basicValuesForNotifications.includes(value)) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings value', { method: 'saveNotificationSettings' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveNotificationSettings' });
		}

		notifications[field].updateMethod(subscription, value);

		return true;
	},

	saveAudioNotificationValue(rid, value) {
		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveAudioNotificationValue' });
		}
		Subscriptions.updateAudioNotificationValueById(subscription._id, value);
		return true;
	},

	saveDesktopNotificationDuration(rid, value) {
		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveDesktopNotificationDuration' });
		}
		Subscriptions.updateDesktopNotificationDurationById(subscription._id, value);
		return true;
	},
});

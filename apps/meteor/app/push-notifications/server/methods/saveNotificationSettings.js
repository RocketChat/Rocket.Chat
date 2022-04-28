import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../../models/server';
import { getUserNotificationPreference } from '../../../utils/server';

const saveAudioNotificationValue = (subId, value) =>
	value === 'default' ? Subscriptions.clearAudioNotificationValueById(subId) : Subscriptions.updateAudioNotificationValueById(subId, value);

Meteor.methods({
	saveNotificationSettings(roomId, field, value) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveNotificationSettings',
			});
		}
		check(roomId, String);
		check(field, String);
		check(value, String);

		const getNotificationPrefValue = (field, value) => {
			if (value === 'default') {
				const userPref = getUserNotificationPreference(Meteor.userId(), field);
				return userPref.origin === 'server' ? null : userPref;
			}
			return { value, origin: 'subscription' };
		};

		const notifications = {
			desktopNotifications: {
				updateMethod: (subscription, value) =>
					Subscriptions.updateNotificationsPrefById(
						subscription._id,
						getNotificationPrefValue('desktop', value),
						'desktopNotifications',
						'desktopPrefOrigin',
					),
			},
			mobilePushNotifications: {
				updateMethod: (subscription, value) =>
					Subscriptions.updateNotificationsPrefById(
						subscription._id,
						getNotificationPrefValue('mobile', value),
						'mobilePushNotifications',
						'mobilePrefOrigin',
					),
			},
			emailNotifications: {
				updateMethod: (subscription, value) =>
					Subscriptions.updateNotificationsPrefById(
						subscription._id,
						getNotificationPrefValue('email', value),
						'emailNotifications',
						'emailPrefOrigin',
					),
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
			hideMentionStatus: {
				updateMethod: (subscription, value) => Subscriptions.updateHideMentionStatusById(subscription._id, value === '1'),
			},
			muteGroupMentions: {
				updateMethod: (subscription, value) => Subscriptions.updateMuteGroupMentions(subscription._id, value === '1'),
			},
			audioNotificationValue: {
				updateMethod: (subscription, value) => saveAudioNotificationValue(subscription._id, value),
			},
		};
		const isInvalidNotification = !Object.keys(notifications).includes(field);
		const basicValuesForNotifications = ['all', 'mentions', 'nothing', 'default'];
		const fieldsMustHaveBasicValues = ['emailNotifications', 'mobilePushNotifications', 'desktopNotifications'];

		if (isInvalidNotification) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', {
				method: 'saveNotificationSettings',
			});
		}

		if (fieldsMustHaveBasicValues.includes(field) && !basicValuesForNotifications.includes(value)) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings value', {
				method: 'saveNotificationSettings',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'saveNotificationSettings',
			});
		}

		notifications[field].updateMethod(subscription, value);

		return true;
	},

	saveAudioNotificationValue(rid, value) {
		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'saveAudioNotificationValue',
			});
		}
		saveAudioNotificationValue(subscription._id, value);
		return true;
	},
});

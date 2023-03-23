import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { ISubscription } from '@rocket.chat/core-typings';

import { Subscriptions } from '../../../models/server';
import { getUserNotificationPreference } from '../../../utils/server';

const saveAudioNotificationValue = (subId: ISubscription['_id'], value: unknown) =>
	value === 'default' ? Subscriptions.clearAudioNotificationValueById(subId) : Subscriptions.updateAudioNotificationValueById(subId, value);

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveNotificationSettings(
			roomId: string,
			field:
				| 'desktopNotifications'
				| 'mobilePushNotifications'
				| 'emailNotifications'
				| 'unreadAlert'
				| 'disableNotifications'
				| 'hideUnreadStatus'
				| 'hideMentionStatus'
				| 'muteGroupMentions'
				| 'audioNotificationValue',
			value: string,
		): boolean;
		saveAudioNotificationValue(subId: string, value: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	saveNotificationSettings(roomId, field, value) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveNotificationSettings',
			});
		}
		check(roomId, String);
		check(field, String);
		check(value, String);

		const getNotificationPrefValue = (field: string, value: unknown) => {
			if (value === 'default') {
				const userPref = getUserNotificationPreference(Meteor.userId(), field);
				return userPref?.origin === 'server' ? null : userPref;
			}
			return { value, origin: 'subscription' };
		};

		const notifications = {
			desktopNotifications: {
				updateMethod: (subscription: ISubscription, value: unknown) =>
					Subscriptions.updateNotificationsPrefById(
						subscription._id,
						getNotificationPrefValue('desktop', value),
						'desktopNotifications',
						'desktopPrefOrigin',
					),
			},
			mobilePushNotifications: {
				updateMethod: (subscription: ISubscription, value: unknown) =>
					Subscriptions.updateNotificationsPrefById(
						subscription._id,
						getNotificationPrefValue('mobile', value),
						'mobilePushNotifications',
						'mobilePrefOrigin',
					),
			},
			emailNotifications: {
				updateMethod: (subscription: ISubscription, value: unknown) =>
					Subscriptions.updateNotificationsPrefById(
						subscription._id,
						getNotificationPrefValue('email', value),
						'emailNotifications',
						'emailPrefOrigin',
					),
			},
			unreadAlert: {
				updateMethod: (subscription: ISubscription, value: unknown) => Subscriptions.updateUnreadAlertById(subscription._id, value),
			},
			disableNotifications: {
				updateMethod: (subscription: ISubscription, value: unknown) =>
					Subscriptions.updateDisableNotificationsById(subscription._id, value === '1'),
			},
			hideUnreadStatus: {
				updateMethod: (subscription: ISubscription, value: unknown) =>
					Subscriptions.updateHideUnreadStatusById(subscription._id, value === '1'),
			},
			hideMentionStatus: {
				updateMethod: (subscription: ISubscription, value: unknown) =>
					Subscriptions.updateHideMentionStatusById(subscription._id, value === '1'),
			},
			muteGroupMentions: {
				updateMethod: (subscription: ISubscription, value: unknown) =>
					Subscriptions.updateMuteGroupMentions(subscription._id, value === '1'),
			},
			audioNotificationValue: {
				updateMethod: (subscription: ISubscription, value: unknown) => saveAudioNotificationValue(subscription._id, value),
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

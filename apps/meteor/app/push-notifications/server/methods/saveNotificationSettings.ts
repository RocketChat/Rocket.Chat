import type { ISubscription } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedById } from '../../../lib/server/lib/notifyListener';
import { getUserNotificationPreference } from '../../../utils/server/getUserNotificationPreference';

const saveAudioNotificationValue = (subId: ISubscription['_id'], value: string) =>
	value === 'default' ? Subscriptions.clearAudioNotificationValueById(subId) : Subscriptions.updateAudioNotificationValueById(subId, value);

export type NotificationFieldType =
	| 'desktopNotifications'
	| 'mobilePushNotifications'
	| 'emailNotifications'
	| 'unreadAlert'
	| 'disableNotifications'
	| 'hideUnreadStatus'
	| 'hideMentionStatus'
	| 'muteGroupMentions'
	| 'audioNotificationValue';
declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveNotificationSettings(roomId: string, field: NotificationFieldType, value: string): boolean;
		saveAudioNotificationValue(subId: string, value: string): boolean;
	}
}

export const saveNotificationSettingsMethod = async (
	userId: string,
	roomId: string,
	field: NotificationFieldType,
	value: string,
): Promise<boolean> => {
	const getNotificationPrefValue = async (field: string, value: unknown) => {
		if (value === 'default') {
			if (!userId) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'saveNotificationSettings',
				});
			}

			const userPref = await getUserNotificationPreference(userId, field);
			return userPref?.origin === 'server' ? null : userPref;
		}
		return { value, origin: 'subscription' };
	};

	const notifications = {
		desktopNotifications: {
			updateMethod: async (subscription: ISubscription, value: unknown) =>
				Subscriptions.updateNotificationsPrefById(
					subscription._id,
					await getNotificationPrefValue('desktop', value),
					'desktopNotifications',
					'desktopPrefOrigin',
				),
		},
		mobilePushNotifications: {
			updateMethod: async (subscription: ISubscription, value: unknown) =>
				Subscriptions.updateNotificationsPrefById(
					subscription._id,
					await getNotificationPrefValue('mobile', value),
					'mobilePushNotifications',
					'mobilePrefOrigin',
				),
		},
		emailNotifications: {
			updateMethod: async (subscription: ISubscription, value: unknown) =>
				Subscriptions.updateNotificationsPrefById(
					subscription._id,
					await getNotificationPrefValue('email', value),
					'emailNotifications',
					'emailPrefOrigin',
				),
		},
		unreadAlert: {
			// @ts-expect-error - Check types of model. The way the method is defined makes difficult to type it, check proper types for `value`
			updateMethod: (subscription: ISubscription, value: string) => Subscriptions.updateUnreadAlertById(subscription._id, value),
		},
		disableNotifications: {
			updateMethod: (subscription: ISubscription, value: unknown) =>
				Subscriptions.updateDisableNotificationsById(subscription._id, value === '1'),
		},
		hideUnreadStatus: {
			updateMethod: (subscription: ISubscription, value: string) =>
				Subscriptions.updateHideUnreadStatusById(subscription._id, value === '1'),
		},
		hideMentionStatus: {
			updateMethod: (subscription: ISubscription, value: unknown) =>
				Subscriptions.updateHideMentionStatusById(subscription._id, value === '1'),
		},
		muteGroupMentions: {
			updateMethod: (subscription: ISubscription, value: unknown) => Subscriptions.updateMuteGroupMentions(subscription._id, value === '1'),
		},
		audioNotificationValue: {
			updateMethod: (subscription: ISubscription, value: string) => saveAudioNotificationValue(subscription._id, value),
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

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, userId);
	if (!subscription) {
		throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
			method: 'saveNotificationSettings',
		});
	}

	const updateResponse = await notifications[field].updateMethod(subscription, value);
	if (updateResponse.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	return true;
};

Meteor.methods<ServerMethods>({
	async saveNotificationSettings(roomId, field, value) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveNotificationSettings',
			});
		}
		check(roomId, String);
		check(field, String);
		check(value, String);

		return saveNotificationSettingsMethod(userId, roomId, field, value);
	},

	async saveAudioNotificationValue(rid, value) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveAudioNotificationValue',
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'saveAudioNotificationValue',
			});
		}

		const saveAudioNotificationResponse = await saveAudioNotificationValue(subscription._id, value);
		if (saveAudioNotificationResponse.modifiedCount) {
			void notifyOnSubscriptionChangedById(subscription._id);
		}

		return true;
	},
});

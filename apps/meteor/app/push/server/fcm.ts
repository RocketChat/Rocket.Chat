import type { IAppsTokens } from '@rocket.chat/core-typings';

import type { PendingPushNotification } from './definition';
import { logger } from './logger';
import type { NativeNotificationParameters } from './push';

const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

type FCMDataField = Record<string, any>;

type FCMNotificationField = {
	title: string;
	body: string;
	image?: string;
};

type FCMMessage = {
	notification?: FCMNotificationField;
	data?: FCMDataField;
	android?: {
		collapseKey?: string;
		priority?: 'HIGH' | 'NORMAL';
		ttl?: string;
		restrictedPackageName?: string;
		data?: FCMDataField;
		notification?: FCMNotificationField;
		fcm_options?: {
			analytics_label?: string;
		};
		direct_boot_ok?: boolean;
	};
	webpush?: {
		headers?: FCMDataField;
		data?: FCMDataField;
		notification?: FCMNotificationField;
		fcm_options?: {
			link?: string;
			analytics_label?: string;
		};
	};
	fcm_options?: {
		analytics_label?: string;
	};
};

export type FCMMessageWithToken = FCMMessage & { token: string };
export type FCMMessageWithTopic = FCMMessage & { topic: string };
export type FCMMessageWithCondition = FCMMessage & { condition: string };

function fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
	const MAX_RETRIES = 5;

	try {
		return fetch(url, options);
	} catch (error) {
		if (retries >= MAX_RETRIES) {
			throw error;
		}
		return fetchWithRetry(url, options, retries + 1);
	}
}

function onNotificationSentSuccess(
	response: Response,
	userTokens: string[],
	notification: PendingPushNotification,
	_replaceToken: (currentToken: IAppsTokens['token'], newToken: IAppsTokens['token']) => void,
	_removeToken: (token: IAppsTokens['token']) => void,
): void {
	response;
	userTokens;
	notification;
}

function getFCMMessagesFromPushData(userTokens: string[], notification: PendingPushNotification): FCMMessageWithToken[] {
	// first we will get the `data` field from the notification
	const data: FCMDataField = notification.payload ? { ejson: EJSON.stringify(notification.payload) } : {};

	// Set image
	if (notification.gcm?.image != null) {
		data.image = notification.gcm?.image;
	}

	// Set extra details
	if (notification.badge != null) {
		data.msgcnt = notification.badge;
	}
	if (notification.sound != null) {
		data.soundname = notification.sound;
	}
	if (notification.notId != null) {
		data.notId = notification.notId;
	}
	if (notification.gcm?.style != null) {
		data.style = notification.gcm?.style;
	}

	if (notification.contentAvailable != null) {
		data['content-available'] = notification.contentAvailable;
	}

	// then we will create the notification field
	const notificationField: FCMNotificationField = {
		title: notification.title,
		body: notification.text,
	};

	// then we will create the message
	const message: FCMMessage = {
		notification: notificationField,
		data,
		android: {
			priority: 'HIGH',
		},
	};

	// then we will create the message for each token
	return userTokens.map((token) => ({ ...message, token }));
}

export const sendFCM = function ({ userTokens, notification, _replaceToken, _removeToken, options }: NativeNotificationParameters): void {
	const tokens = typeof userTokens === 'string' ? [userTokens] : userTokens;
	if (!tokens.length) {
		logger.debug('sendFCM no push tokens found');
		return;
	}

	logger.debug('sendFCM', tokens, notification);

	const messages = getFCMMessagesFromPushData(tokens, notification);
	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `Bearer: ${options.gcm.apiKey}`,
	};

	for (const message of messages) {
		const data = {
			validate_only: false,
			message,
		};

		const response = fetchWithRetry(FCM_API_URL, { method: 'POST', headers, body: JSON.stringify(data) });

		response
			.then((res) => onNotificationSentSuccess(res, tokens, notification, _replaceToken, _removeToken))
			.catch((err) => {
				logger.error('sendFCM error', err);
			});
	}
};

import EJSON from 'ejson';
import fetch from 'node-fetch';
import type { RequestInit, Response } from 'node-fetch';

import type { PendingPushNotification } from './definition';
import { logger } from './logger';
import type { NativeNotificationParameters } from './push';

type FCMDataField = Record<string, any>;

type FCMNotificationField = {
	title: string;
	body: string;
	image?: string;
};

type FCMMessage = {
	notification?: FCMNotificationField;
	data?: FCMDataField;
	token?: string;
	to?: string;
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

// https://firebase.google.com/docs/reference/fcm/rest/v1/ErrorCode
type FCMError = {
	error: {
		code: number;
		message: string;
		status: string;
	};
};

function fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
	const MAX_RETRIES = 5;
	const ERRORS_TO_RETRY = [429, 500, 502, 503, 504];

	try {
		return fetch(url, options);
	} catch (error) {
		if (retries >= MAX_RETRIES) {
			throw error;
		}

		const errorData = error as FCMError;

		if (!errorData?.error?.code || !ERRORS_TO_RETRY.includes(errorData.error.code)) {
			throw error;
		}

		return fetchWithRetry(url, options, retries + 1);
	}
}

function getFCMMessagesFromPushData(userTokens: string[], notification: PendingPushNotification): { message: FCMMessage }[] {
	// first we will get the `data` field from the notification
	const data: FCMDataField = notification.payload ? { ejson: EJSON.stringify(notification.payload) } : {};

	// Set image
	if (notification.gcm?.image) {
		data.image = notification.gcm?.image;
	}

	// Set extra details
	if (notification.badge) {
		data.msgcnt = notification.badge.toString();
	}

	if (notification.sound) {
		data.soundname = notification.sound;
	}

	if (notification.notId) {
		data.notId = notification.notId.toString();
	}

	if (notification.gcm?.style) {
		data.style = notification.gcm?.style;
	}

	if (notification.contentAvailable) {
		data['content-available'] = notification.contentAvailable.toString();
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
	return userTokens.map((token) => ({ message: { ...message, token } }));
}

export const sendFCM = function ({ userTokens, notification, _replaceToken, _removeToken, options }: NativeNotificationParameters): void {
	// We don't use these parameters, but we need to keep them to keep the function signature
	// TODO: Remove them when we remove the old sendGCM function
	_replaceToken;
	_removeToken;

	const tokens = typeof userTokens === 'string' ? [userTokens] : userTokens;
	if (!tokens.length) {
		logger.log('sendFCM no push tokens found');
		return;
	}

	logger.debug('sendFCM', tokens, notification);

	const messages = getFCMMessagesFromPushData(tokens, notification);
	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${options.gcm.apiKey}`,
		'access_token_auth': true,
	} as Record<string, any>;

	if (!options.gcm.projectNumber.trim()) {
		logger.error('sendFCM error: GCM project number is missing');
		return;
	}

	const url = `https://fcm.googleapis.com/v1/projects/${options.gcm.projectNumber}/messages:send`;

	for (const message of messages) {
		logger.debug('sendFCM message', message);
		const response = fetchWithRetry(url, { method: 'POST', headers, body: JSON.stringify(message) });

		response.catch((err) => {
			logger.error('sendFCM error', err);
		});
	}
};

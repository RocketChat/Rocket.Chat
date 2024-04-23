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

/**
 * Set at least a 10 second timeout on send requests before retrying.
 * Most of FCM's internal Remote Procedure Calls use a 10 second timeout.
 *
 * Errors:
 * - For 400, 401, 403, 404 errors: abort, and do not retry.
 * - For 429 errors: retry after waiting for the duration set in the retry-after header. If no retry-after header is set, default to 60 seconds.
 * - For 500 errors: retry with exponential backoff.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
	const MAX_RETRIES = 5;
	const response = await fetch(url, options);

	if (response.ok) {
		return response;
	}

	if (retries >= MAX_RETRIES) {
		logger.error('sendFCM error: max retries reached');
		return response;
	}

	const retryAfter = response.headers.get('retry-after');
	const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;

	if (response.status === 429) {
		await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
		return fetchWithRetry(url, options, retries + 1);
	}

	if (response.status >= 500 && response.status < 600) {
		const backoff = Math.pow(2, retries) * 10000;
		await new Promise((resolve) => setTimeout(resolve, backoff));
		return fetchWithRetry(url, options, retries + 1);
	}

	const error: FCMError = await response.json();
	logger.error('sendFCM error', error);

	return response;
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

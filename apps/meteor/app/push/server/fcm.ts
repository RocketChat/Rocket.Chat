import fetch from 'node-fetch';
import EJSON from 'ejson';
import type { RequestInit, Response } from 'node-fetch';
import type { PendingPushNotification } from './definition';
import { settings } from '../../settings/server';
import { logger } from './logger';
import type { FCMCredentials, NativeNotificationParameters } from './push';

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

function getFCMMessagesFromPushData(userTokens: string[], notification: PendingPushNotification): { message: FCMMessage }[] {
	// first we will get the `data` field from the notification
	const data: FCMDataField = notification.payload ? { ejson: EJSON.stringify(notification.payload) } : {};

	// Set image
	if (notification.gcm?.image != null) {
		data.image = notification.gcm?.image;
	}

	// Set extra details
	if (notification.badge != null) {
		data.msgcnt = notification.badge.toString();
	}
	if (notification.sound != null) {
		data.soundname = notification.sound;
	}
	if (notification.notId != null) {
		data.notId = notification.notId.toString();
	}
	if (notification.gcm?.style != null) {
		data.style = notification.gcm?.style;
	}

	if (notification.contentAvailable != null) {
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
	return userTokens.map((token) => ({ message: { ...message, token, } }));
}

export const sendFCM = function ({ userTokens, notification, _replaceToken, _removeToken, options }: NativeNotificationParameters): void {
	// We don't use these parameters, but we need to keep them to keep the function signature
	// TODO: Remove them when we remove the old sendGCM function
	_replaceToken;
	_removeToken;

	const tokens = typeof userTokens === 'string' ? [userTokens] : userTokens;
	if (!tokens.length) {
		logger.debug('sendFCM no push tokens found');
		return;
	}

	logger.debug('sendFCM', tokens, notification);

	const messages = getFCMMessagesFromPushData(tokens, notification);
	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${options.gcm.apiKey}`,
		access_token_auth: true,
	} as Record<string, any>;

	const credentialsString = settings.get('Push_google_api_credentials');
	if (!credentialsString) {
		throw new Error('Push_google_api_credentials is not set');
	}

	const credentials = JSON.parse(credentialsString as string) as FCMCredentials;
	
	const url = `https://fcm.googleapis.com/v1/projects/${credentials.project_id}/messages:send`;

	for (const message of messages) {
		logger.debug('sendFCM message', message);
		const response = fetchWithRetry(url, { method: 'POST', headers, body: JSON.stringify(message) });

		response
			.catch((err) => {
				logger.error('sendFCM error', err);
			});
	}
};

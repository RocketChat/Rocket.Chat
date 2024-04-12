import type { IAppsTokens } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
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

async function fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
	const MAX_RETRIES = 5;

	try {
		return await fetch(url, options);
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
): void {}

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
	// Make sure userTokens are an array of strings
	if (typeof userTokens === 'string') {
		userTokens = [userTokens];
	}

	// Check if any tokens in there to send
	if (!userTokens.length) {
		logger.debug('sendFCM no push tokens found');
		return;
	}

	logger.debug('sendFCM', userTokens, notification);

	const messages = getFCMMessagesFromPushData(userTokens, notification);
	const authHeader = `Bearer ${options?.gcm.apiKey}`;

	const project = settings.get<string>('Push_google_project_id');
	if (!project) {
		logger.error('Push_google_project_id is not configured');
		return;
	}

	for (const message of messages) {
		const url = `https://fcm.googleapis.com/v1/projects/${project}/messages:send`;
		const headers = {
			'Content-Type': 'application/json',
			'Authorization': authHeader,
		};

		const data = {
			validate_only: false,
			message,
		};

		const response = fetchWithRetry(url, { method: 'POST', headers, body: JSON.stringify(data) });

		response
			.then((res) => onNotificationSentSuccess(res, userTokens as string[], notification, _replaceToken, _removeToken))
			.catch((err) => {
				logger.error('sendFCM error', err);
			});
	}
};

import EJSON from 'ejson';
import gcm from 'node-gcm';

import { logger } from './logger';
import type { NativeNotificationParameters } from './push';

/**
 * @deprecated Use sendFCM instead, node-gcm is deprecated and google will remove it soon
 */
export const sendGCM = function ({ userTokens, notification, _replaceToken, _removeToken, options }: NativeNotificationParameters) {
	// Make sure userTokens are an array of strings
	if (typeof userTokens === 'string') {
		userTokens = [userTokens];
	}

	// Check if any tokens in there to send
	if (!userTokens.length) {
		logger.debug('sendGCM no push tokens found');
		return;
	}

	logger.debug('sendGCM', userTokens, notification);

	// Allow user to set payload
	const data: Record<string, any> = notification.payload ? { ejson: EJSON.stringify(notification.payload) } : {};

	data.title = notification.title;
	data.message = notification.text;

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

	const message = new gcm.Message({
		collapseKey: notification.from,
		// Requires delivery of real-time messages to users while device is in Doze or app is in App Standby.
		// https://developer.android.com/training/monitoring-device-state/doze-standby#exemption-cases
		priority: 'high',
		//    delayWhileIdle: true,
		//    timeToLive: 4,
		//    restricted_package_name: 'dk.gi2.app'
		data,
	});

	logger.debug(`Create GCM Sender using "${options.gcm.apiKey}"`);
	const sender = new gcm.Sender(options.gcm.apiKey);

	userTokens.forEach((value) => logger.debug(`A:Send message to: ${value}`));

	const userToken = userTokens.length === 1 ? userTokens[0] : null;

	sender.send(message, userTokens, 5, (err, result) => {
		if (err) {
			logger.debug({ msg: 'ANDROID ERROR: result of sender', result });
			return;
		}

		if (result === null) {
			logger.debug('ANDROID: Result of sender is null');
			return;
		}

		logger.debug({ msg: 'ANDROID: Result of sender', result });

		if (result.canonical_ids === 1 && userToken && result.results?.[0].registration_id) {
			// This is an old device, token is replaced
			try {
				_replaceToken({ gcm: userToken }, { gcm: result.results[0].registration_id });
			} catch (err) {
				logger.error({ msg: 'Error replacing token', err });
			}
		}
		// We cant send to that token - might not be registered
		// ask the user to remove the token from the list
		if (result.failure !== 0 && userToken) {
			// This is an old device, token is replaced
			try {
				_removeToken({ gcm: userToken });
			} catch (err) {
				logger.error({ msg: 'Error removing token', err });
			}
		}
	});
};

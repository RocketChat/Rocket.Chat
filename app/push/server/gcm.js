/* eslint-disable new-cap */
import { Match } from 'meteor/check';
import { EJSON } from 'meteor/ejson';
import gcm from 'node-gcm';

import { logger } from './logger';

export const sendGCM = function({ userTokens, notification, _replaceToken, _removeToken, options }) {
	if (Match.test(notification.gcm, Object)) {
		notification = Object.assign({}, notification, notification.gcm);
	}

	// Make sure userTokens are an array of strings
	if (Match.test(userTokens, String)) {
		userTokens = [userTokens];
	}

	// Check if any tokens in there to send
	if (!userTokens.length) {
		logger.debug('sendGCM no push tokens found');
		return;
	}

	logger.debug('sendGCM', userTokens, notification);

	// Allow user to set payload
	const data = notification.payload ? { ejson: EJSON.stringify(notification.payload) } : {};

	data.title = notification.title;
	data.message = notification.text;

	// Set image
	if (notification.image != null) {
		data.image = notification.image;
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
	if (notification.style != null) {
		data.style = notification.style;
	}
	if (notification.summaryText != null) {
		data.summaryText = notification.summaryText;
	}
	if (notification.picture != null) {
		data.picture = notification.picture;
	}

	const message = new gcm.Message({
		collapseKey: notification.from,
		//    delayWhileIdle: true,
		//    timeToLive: 4,
		//    restricted_package_name: 'dk.gi2.app'
		data,
	});

	logger.debug(`Create GCM Sender using "${ options.gcm.apiKey }"`);
	const sender = new gcm.Sender(options.gcm.apiKey);

	userTokens.forEach((value) => logger.debug(`A:Send message to: ${ value }`));

	const userToken = userTokens.length === 1 ? userTokens[0] : null;

	sender.send(message, userTokens, 5, function(err, result) {
		if (err) {
			logger.debug(`ANDROID ERROR: result of sender: ${ result }`);
			return;
		}

		if (result === null) {
			logger.debug('ANDROID: Result of sender is null');
			return;
		}

		logger.debuglog(`ANDROID: Result of sender: ${ JSON.stringify(result) }`);

		if (result.canonical_ids === 1 && userToken) {
			// This is an old device, token is replaced
			try {
				_replaceToken({ gcm: userToken }, { gcm: result.results[0].registration_id });
			} catch (err) {
				logger.error('Error replacing token', err);
			}
		}
		// We cant send to that token - might not be registered
		// ask the user to remove the token from the list
		if (result.failure !== 0 && userToken) {
			// This is an old device, token is replaced
			try {
				_removeToken({ gcm: userToken });
			} catch (err) {
				logger.error('Error removing token', err);
			}
		}
	});
};

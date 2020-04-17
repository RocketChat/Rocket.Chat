/* eslint-disable new-cap */
import { Match } from 'meteor/check';
import { EJSON } from 'meteor/ejson';
import _ from 'underscore';
import gcm from 'node-gcm';
import Fiber from 'fibers';

import { logger } from './logger';

export const sendGCM = function({ userTokens, notification, _replaceToken, _removeToken, options }) {
	if (Match.test(notification.gcm, Object)) {
		notification = _.extend({}, notification, notification.gcm);
	}

	// Make sure userTokens are an array of strings
	if (userTokens === `${ userTokens }`) {
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
	if (typeof notification.image !== 'undefined') {
		data.image = notification.image;
	}

	// Set extra details
	if (typeof notification.badge !== 'undefined') {
		data.msgcnt = notification.badge;
	}
	if (typeof notification.sound !== 'undefined') {
		data.soundname = notification.sound;
	}
	if (typeof notification.notId !== 'undefined') {
		data.notId = notification.notId;
	}
	if (typeof notification.style !== 'undefined') {
		data.style = notification.style;
	}
	if (typeof notification.summaryText !== 'undefined') {
		data.summaryText = notification.summaryText;
	}
	if (typeof notification.picture !== 'undefined') {
		data.picture = notification.picture;
	}

	// var message = new gcm.Message();
	const message = new gcm.Message({
		collapseKey: notification.from,
		//    delayWhileIdle: true,
		//    timeToLive: 4,
		//    restricted_package_name: 'dk.gi2.app'
		data,
	});

	logger.debug(`Create GCM Sender using "${ options.gcm.apiKey }"`);
	const sender = new gcm.Sender(options.gcm.apiKey);

	_.each(userTokens, function(value /* , key */) {
		logger.debug(`A:Send message to: ${ value }`);
	});

	/* message.addData('title', title);
	message.addData('message', text);
	message.addData('msgcnt', '1');
	message.collapseKey = 'sitDrift';
	message.delayWhileIdle = true;
	message.timeToLive = 3;*/

	// /**
	//  * Parameters: message-literal, userTokens-array, No. of retries, callback-function
	//  */

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

		if (result.canonical_ids === 1 && userToken) { // jshint ignore:line
			// This is an old device, token is replaced
			Fiber(function(self) {
				// Run in fiber
				try {
					self.callback(self.oldToken, self.newToken);
				} catch (err) {
					//
				}
			}).run({
				oldToken: { gcm: userToken },
				newToken: { gcm: result.results[0].registration_id }, // jshint ignore:line
				callback: _replaceToken,
			});
			// _replaceToken({ gcm: userToken }, { gcm: result.results[0].registration_id });
		}
		// We cant send to that token - might not be registred
		// ask the user to remove the token from the list
		if (result.failure !== 0 && userToken) {
			// This is an old device, token is replaced
			Fiber(function(self) {
				// Run in fiber
				try {
					self.callback(self.token);
				} catch (err) {
					//
				}
			}).run({
				token: { gcm: userToken },
				callback: _removeToken,
			});
			// _replaceToken({ gcm: userToken }, { gcm: result.results[0].registration_id });
		}
	});
	// /** Use the following line if you want to send the message without retries
	// sender.sendNoRetry(message, userTokens, function (result) {
	//     console.log('ANDROID: ' + JSON.stringify(result));
	// });
	// **/
}; // EO sendAndroid

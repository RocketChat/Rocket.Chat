/* eslint-disable new-cap */
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { appTokensCollection, notificationsCollection } from './push';
import { initAPN, sendAPN } from './apn';
import { sendGCM } from './gcm';
import { logger, LoggerManager } from './logger';

let isConfigured = false;

const sendWorker = function(task, interval) {
	logger.debug(`Send worker started, using interval: ${ interval }`);

	return Meteor.setInterval(function() {
		// xxx: add exponential backoff on error
		try {
			task();
		} catch (error) {
			logger.debug(`Error while sending: ${ error.message }`);
		}
	}, interval);
};

export const Configure = function(options) {
	options = _.extend({
		sendTimeout: 60000, // Timeout period for notification send
	}, options);
	// https://npmjs.org/package/apn

	// After requesting the certificate from Apple, export your private key as
	// a .p12 file anddownload the .cer file from the iOS Provisioning Portal.

	// gateway.push.apple.com, port 2195
	// gateway.sandbox.push.apple.com, port 2195

	// Now, in the directory containing cert.cer and key.p12 execute the
	// following commands to generate your .pem files:
	// $ openssl x509 -in cert.cer -inform DER -outform PEM -out cert.pem
	// $ openssl pkcs12 -in key.p12 -out key.pem -nodes

	// Block multiple calls
	if (isConfigured) {
		throw new Error('Configure should not be called more than once!');
	}

	isConfigured = true;

	logger.debug('Configure', options);

	const _replaceToken = function(currentToken, newToken) {
		appTokensCollection.update({ token: currentToken }, { $set: { token: newToken } }, { multi: true });
	};

	const _removeToken = function(token) {
		appTokensCollection.update({ token }, { $unset: { token: true } }, { multi: true });
	};

	if (options.apn) {
		initAPN({ options, _removeToken });
	} // EO ios notification

	// Universal send function
	const _querySend = function(query, notification) {
		const countApn = [];
		const countGcm = [];

		appTokensCollection.find(query).forEach(function(app) {
			logger.debug('send to token', app.token);

			if (app.token.apn) {
				countApn.push(app._id);
				// Send to APN
				if (options.apn) {
					sendAPN(app.token.apn, notification);
				}
			} else if (app.token.gcm) {
				countGcm.push(app._id);

				// Send to GCM
				// We do support multiple here - so we should construct an array
				// and send it bulk - Investigate limit count of id's
				if (options.gcm && options.gcm.apiKey) {
					sendGCM({ userTokens: app.token.gcm, notification, _replaceToken, _removeToken, options });
				}
			} else {
				throw new Error('send got a faulty query');
			}
		});

		if (LoggerManager.logLevel === 2) {
			logger.debug(`Sent message "${ notification.title }" to ${ countApn.length } ios apps ${ countGcm.length } android apps`);

			// Add some verbosity about the send result, making sure the developer
			// understands what just happened.
			if (!countApn.length && !countGcm.length) {
				if (appTokensCollection.find().count() === 0) {
					logger.debug('GUIDE: The "appTokensCollection" is empty - No clients have registered on the server yet...');
				}
			} else if (!countApn.length) {
				if (appTokensCollection.find({ 'token.apn': { $exists: true } }).count() === 0) {
					logger.debug('GUIDE: The "appTokensCollection" - No APN clients have registered on the server yet...');
				}
			} else if (!countGcm.length) {
				if (appTokensCollection.find({ 'token.gcm': { $exists: true } }).count() === 0) {
					logger.debug('GUIDE: The "appTokensCollection" - No GCM clients have registered on the server yet...');
				}
			}
		}

		return {
			apn: countApn,
			gcm: countGcm,
		};
	};

	const serverSend = function(options) {
		options = options || { badge: 0 };
		let query;

		// Check basic options
		if (options.from !== `${ options.from }`) {
			throw new Error('send: option "from" not a string');
		}

		if (options.title !== `${ options.title }`) {
			throw new Error('send: option "title" not a string');
		}

		if (options.text !== `${ options.text }`) {
			throw new Error('send: option "text" not a string');
		}

		if (options.token || options.tokens) {
			// The user set one token or array of tokens
			const tokenList = options.token ? [options.token] : options.tokens;

			logger.debug(`Send message "${ options.title }" via token(s)`, tokenList);

			query = {
				$or: [
					// XXX: Test this query: can we hand in a list of push tokens?
					{ $and: [
						{ token: { $in: tokenList } },
						// And is not disabled
						{ enabled: { $ne: false } },
					],
					},
					// XXX: Test this query: does this work on app id?
					{ $and: [
						{ _id: { $in: tokenList } }, // one of the app ids
						{ $or: [
							{ 'token.apn': { $exists: true } }, // got apn token
							{ 'token.gcm': { $exists: true } }, // got gcm token
						] },
						// And is not disabled
						{ enabled: { $ne: false } },
					],
					},
				],
			};
		} else if (options.query) {
			logger.debug(`Send message "${ options.title }" via query`, options.query);

			query = {
				$and: [
					options.query, // query object
					{ $or: [
						{ 'token.apn': { $exists: true } }, // got apn token
						{ 'token.gcm': { $exists: true } }, // got gcm token
					] },
					// And is not disabled
					{ enabled: { $ne: false } },
				],
			};
		}


		if (query) {
			// Convert to querySend and return status
			return _querySend(query, options);
		}
		throw new Error('send: please set option "token"/"tokens" or "query"');
	};


	// This interval will allow only one notification to be sent at a time, it
	// will check for new notifications at every `options.sendInterval`
	// (default interval is 15000 ms)
	//
	// It looks in notifications collection to see if theres any pending
	// notifications, if so it will try to reserve the pending notification.
	// If successfully reserved the send is started.
	//
	// If notification.query is type string, it's assumed to be a json string
	// version of the query selector. Making it able to carry `$` properties in
	// the mongo collection.
	//
	// Pr. default notifications are removed from the collection after send have
	// completed. Setting `options.keepNotifications` will update and keep the
	// notification eg. if needed for historical reasons.
	//
	// After the send have completed a "send" event will be emitted with a
	// status object containing notification id and the send result object.
	//
	let isSendingNotification = false;

	if (options.sendInterval !== null) {
		// This will require index since we sort notifications by createdAt
		notificationsCollection._ensureIndex({ createdAt: 1 });
		notificationsCollection._ensureIndex({ sent: 1 });
		notificationsCollection._ensureIndex({ sending: 1 });
		notificationsCollection._ensureIndex({ delayUntil: 1 });

		const sendNotification = function(notification) {
			// Reserve notification
			const now = +new Date();
			const timeoutAt = now + options.sendTimeout;
			const reserved = notificationsCollection.update({
				_id: notification._id,
				sent: false, // xxx: need to make sure this is set on create
				sending: { $lt: now },
			},
			{
				$set: {
					sending: timeoutAt,
				},
			});

			// Make sure we only handle notifications reserved by this
			// instance
			if (reserved) {
				// Check if query is set and is type String
				if (notification.query && notification.query === `${ notification.query }`) {
					try {
						// The query is in string json format - we need to parse it
						notification.query = JSON.parse(notification.query);
					} catch (err) {
						// Did the user tamper with this??
						throw new Error(`Error while parsing query string, Error: ${ err.message }`);
					}
				}

				// Send the notification
				const result = serverSend(notification);

				if (!options.keepNotifications) {
					// Pr. Default we will remove notifications
					notificationsCollection.remove({ _id: notification._id });
				} else {
					// Update the notification
					notificationsCollection.update({ _id: notification._id }, {
						$set: {
							// Mark as sent
							sent: true,
							// Set the sent date
							sentAt: new Date(),
							// Count
							count: result,
							// Not being sent anymore
							sending: 0,
						},
					});
				}

				// Emit the send
				// self.emit('send', { notification: notification._id, result });
			} // Else could not reserve
		}; // EO sendNotification

		sendWorker(function() {
			if (isSendingNotification) {
				return;
			}

			try {
				// Set send fence
				isSendingNotification = true;

				// var countSent = 0;
				const batchSize = options.sendBatchSize || 1;

				const now = +new Date();

				// Find notifications that are not being or already sent
				const pendingNotifications = notificationsCollection.find({ $and: [
					// Message is not sent
					{ sent: false },
					// And not being sent by other instances
					{ sending: { $lt: now } },
					// And not queued for future
					{ $or: [
						{ delayUntil: { $exists: false } },
						{ delayUntil: { $lte: new Date() } },
					],
					},
				] }, {
					// Sort by created date
					sort: { createdAt: 1 },
					limit: batchSize,
				});

				pendingNotifications.forEach(function(notification) {
					try {
						sendNotification(notification);
					} catch (error) {
						logger.debug(`Could not send notification id: "${ notification._id }", Error: ${ error.message }`);
					}
				}); // EO forEach
			} finally {
				// Remove the send fence
				isSendingNotification = false;
			}
		}, options.sendInterval || 15000); // Default every 15th sec
	} else {
		logger.debug('Send server is disabled');
	}
};

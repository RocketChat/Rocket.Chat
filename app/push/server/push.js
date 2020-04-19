import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { Match, check } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import { HTTP } from 'meteor/http';
import _ from 'underscore';

import { initAPN, sendAPN } from './apn';
import { sendGCM } from './gcm';
import { logger, LoggerManager } from './logger';

export const _matchToken = Match.OneOf({ apn: String }, { gcm: String });
export const notificationsCollection = new Mongo.Collection('_raix_push_notifications');
export const appTokensCollection = new Mongo.Collection('_raix_push_app_tokens');

appTokensCollection._ensureIndex({ userId: 1 });
notificationsCollection._ensureIndex({ createdAt: 1 });
notificationsCollection._ensureIndex({ sent: 1 });
notificationsCollection._ensureIndex({ sending: 1 });
notificationsCollection._ensureIndex({ delayUntil: 1 });

export class PushClass {
	options = {}

	isConfigured = false

	configure(options) {
		this.options = Object.assign({
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
		if (this.isConfigured) {
			throw new Error('Configure should not be called more than once!');
		}

		this.isConfigured = true;

		logger.debug('Configure', this.options);

		if (this.options.apn) {
			initAPN({ options: this.options, absoluteUrl: Meteor.absoluteUrl() });
		}

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

		const sendNotification = (notification) => {
			logger.debug('Sending notification', notification);

			// Reserve notification
			const now = Date.now();
			const timeoutAt = now + this.options.sendTimeout;
			const reserved = notificationsCollection.update({
				_id: notification._id,
				sent: false, // xxx: need to make sure this is set on create
				sending: { $lt: now },
			}, {
				$set: {
					sending: timeoutAt,
				},
			});

			// Make sure we only handle notifications reserved by this instance
			if (reserved) {
				// Check if query is set and is type String
				if (notification.query && notification.query === String(notification.query)) {
					try {
						// The query is in string json format - we need to parse it
						notification.query = JSON.parse(notification.query);
					} catch (err) {
						// Did the user tamper with this??
						throw new Error(`Error while parsing query string, Error: ${ err.message }`);
					}
				}

				// Send the notification
				const result = this.serverSend(notification, this.options);

				if (!this.options.keepNotifications) {
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
			}
		};

		this.sendWorker(() => {
			if (isSendingNotification) {
				return;
			}

			try {
				// Set send fence
				isSendingNotification = true;

				const batchSize = this.options.sendBatchSize || 1;

				// Find notifications that are not being or already sent
				notificationsCollection.find({
					sent: false,
					sending: { $lt: Date.now() },
					$or: [
						{ delayUntil: { $exists: false } },
						{ delayUntil: { $lte: new Date() } },
					],
				}, {
					sort: { createdAt: 1 },
					limit: batchSize,
				}).forEach((notification) => {
					try {
						sendNotification(notification);
					} catch (error) {
						logger.debug(`Could not send notification id: "${ notification._id }", Error: ${ error.message }`);
						logger.debug(error.stack);
					}
				});
			} finally {
				// Remove the send fence
				isSendingNotification = false;
			}
		}, this.options.sendInterval || 15000); // Default every 15th sec
	}

	sendWorker(task, interval) {
		logger.debug(`Send worker started, using interval: ${ interval }`);

		return Meteor.setInterval(() => {
			try {
				task();
			} catch (error) {
				logger.debug(`Error while sending: ${ error.message }`);
			}
		}, interval);
	}

	_replaceToken(currentToken, newToken) {
		appTokensCollection.rawCollection().updateMany({ token: currentToken }, { $set: { token: newToken } });
	}

	_removeToken(token) {
		appTokensCollection.rawCollection().deleteOne({ token });
	}

	serverSendNative(app, notification, countApn, countGcm) {
		logger.debug('send to token', app.token);

		notification.payload = notification.payload ? { ejson: EJSON.stringify(notification.payload) } : {};

		if (app.token.apn) {
			countApn.push(app._id);
			// Send to APN
			if (this.options.apn) {
				notification.topic = app.appName;
				sendAPN({ userToken: app.token.apn, notification, _removeToken: this._removeToken });
			}
		} else if (app.token.gcm) {
			countGcm.push(app._id);

			// Send to GCM
			// We do support multiple here - so we should construct an array
			// and send it bulk - Investigate limit count of id's
			if (this.options.gcm && this.options.gcm.apiKey) {
				sendGCM({ userTokens: app.token.gcm, notification, _replaceToken: this._replaceToken, _removeToken: this._removeToken, options: this.options });
			}
		} else {
			throw new Error('send got a faulty query');
		}
	}

	sendGatewayPush(gateway, service, token, notification, tries = 0) {
		notification.uniqueId = this.options.uniqueId;

		const data = {
			data: {
				token,
				options: notification,
			},
			headers: {},
		};

		if (token && this.options.getAuthorization) {
			data.headers.Authorization = this.options.getAuthorization();
		}

		return HTTP.post(`${ gateway }/push/${ service }/send`, data, (error, response) => {
			if (response && response.statusCode === 406) {
				logger.info('removing push token', token);
				appTokensCollection.remove({
					$or: [{
						'token.apn': token,
					}, {
						'token.gcm': token,
					}],
				});
				return;
			}

			if (!error) {
				return;
			}

			logger.error(`Error sending push to gateway (${ tries } try) ->`, error);

			if (tries <= 6) {
				const ms = Math.pow(10, tries + 2);

				logger.log('Trying sending push to gateway again in', ms, 'milliseconds');

				return Meteor.setTimeout(() => this.sendGatewayPush(gateway, service, token, notification, tries + 1), ms);
			}
		});
	}

	serverSendGateway(app, notification, countApn, countGcm) {
		for (const gateway of this.options.gateways) {
			logger.debug('send to token', app.token);

			if (app.token.apn) {
				countApn.push(app._id);
				notification.topic = app.appName;
				return this.sendGatewayPush(gateway, 'apn', app.token.apn, notification);
			}

			if (app.token.gcm) {
				countGcm.push(app._id);
				return this.sendGatewayPush(gateway, 'gcm', app.token.gcm, notification);
			}
		}
	}

	serverSend(notification = { badge: 0 }) {
		const countApn = [];
		const countGcm = [];

		if (notification.from !== String(notification.from)) {
			throw new Error('Push.send: option "from" not a string');
		}
		if (notification.title !== String(notification.title)) {
			throw new Error('Push.send: option "title" not a string');
		}
		if (notification.text !== String(notification.text)) {
			throw new Error('Push.send: option "text" not a string');
		}

		logger.debug(`send message "${ notification.title }" via query`, notification.query);

		const query = {
			$and: [notification.query, {
				$or: [{
					'token.apn': {
						$exists: true,
					},
				}, {
					'token.gcm': {
						$exists: true,
					},
				}],
			}],
		};

		appTokensCollection.find(query).forEach((app) => {
			logger.debug('send to token', app.token);

			if (this.options.gateways) {
				return this.serverSendGateway(app, notification, countApn, countGcm);
			}

			return this.serverSendNative(app, notification, countApn, countGcm);
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
	}

	// This is a general function to validate that the data added to notifications
	// is in the correct format. If not this function will throw errors
	_validateDocument(notification) {
		// Check the general notification
		check(notification, {
			from: String,
			title: String,
			text: String,
			sent: Match.Optional(Boolean),
			sending: Match.Optional(Match.Integer),
			badge: Match.Optional(Match.Integer),
			sound: Match.Optional(String),
			notId: Match.Optional(Match.Integer),
			contentAvailable: Match.Optional(Match.Integer),
			forceStart: Match.Optional(Match.Integer),
			apn: Match.Optional({
				from: Match.Optional(String),
				title: Match.Optional(String),
				text: Match.Optional(String),
				badge: Match.Optional(Match.Integer),
				sound: Match.Optional(String),
				notId: Match.Optional(Match.Integer),
				actions: Match.Optional([Match.Any]),
				category: Match.Optional(String),
			}),
			gcm: Match.Optional({
				from: Match.Optional(String),
				title: Match.Optional(String),
				text: Match.Optional(String),
				image: Match.Optional(String),
				style: Match.Optional(String),
				summaryText: Match.Optional(String),
				picture: Match.Optional(String),
				badge: Match.Optional(Match.Integer),
				sound: Match.Optional(String),
				notId: Match.Optional(Match.Integer),
			}),
			android_channel_id: Match.Optional(String),
			query: Match.Optional(String),
			token: Match.Optional(_matchToken),
			tokens: Match.Optional([_matchToken]),
			payload: Match.Optional(Object),
			delayUntil: Match.Optional(Date),
			createdAt: Date,
			createdBy: Match.OneOf(String, null),
		});

		// Make sure a token selector or query have been set
		if (!notification.token && !notification.tokens && !notification.query) {
			throw new Error('No token selector or query found');
		}

		// If tokens array is set it should not be empty
		if (notification.tokens && !notification.tokens.length) {
			throw new Error('No tokens in array');
		}
	}

	send(options) {
		// If on the client we set the user id - on the server we need an option
		// set or we default to "<SERVER>" as the creator of the notification
		// If current user not set see if we can set it to the logged in user
		// this will only run on the client if Meteor.userId is available
		const currentUser = options.createdBy || '<SERVER>';

		// Rig the notification object
		const notification = Object.assign({
			createdAt: new Date(),
			createdBy: currentUser,
			sent: false,
			sending: 0,
		}, _.pick(options, 'from', 'title', 'text'));

		// Add extra
		Object.assign(notification, _.pick(options, 'payload', 'badge', 'sound', 'notId', 'delayUntil', 'android_channel_id'));

		if (Match.test(options.apn, Object)) {
			notification.apn = _.pick(options.apn, 'from', 'title', 'text', 'badge', 'sound', 'notId', 'category');
		}

		if (Match.test(options.gcm, Object)) {
			notification.gcm = _.pick(options.gcm, 'image', 'style', 'summaryText', 'picture', 'from', 'title', 'text', 'badge', 'sound', 'notId', 'actions', 'android_channel_id');
		}

		// Set one token selector, this can be token, array of tokens or query
		if (options.query) {
			notification.query = JSON.stringify(options.query);
		}

		if (options.contentAvailable != null) {
			notification.contentAvailable = options.contentAvailable;
		}

		if (options.forceStart != null) {
			notification.forceStart = options.forceStart;
		}

		// Validate the notification
		this._validateDocument(notification);

		// Try to add the notification to send, we return an id to keep track
		return notificationsCollection.insert(notification);
	}
}

export const Push = new PushClass();

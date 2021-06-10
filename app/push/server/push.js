import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import _ from 'underscore';

import HTTP from '../../../server/http/http';
import { initAPN, sendAPN } from './apn';
import { sendGCM } from './gcm';
import { logger, LoggerManager } from './logger';
import { settings } from '../../settings/server';

export const _matchToken = Match.OneOf({ apn: String }, { gcm: String });
export const appTokensCollection = new Mongo.Collection('_raix_push_app_tokens');

appTokensCollection._ensureIndex({ userId: 1 });

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

	_shouldUseGateway() {
		return !!this.options.gateways
			&& settings.get('Register_Server')
			&& settings.get('Cloud_Service_Agree_PrivacyTerms');
	}

	sendNotificationNative(app, notification, countApn, countGcm) {
		logger.debug('send to token', app.token);

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

	async sendGatewayPush(gateway, service, token, notification, tries = 0) {
		notification.uniqueId = this.options.uniqueId;

		const data = {
			body: {
				token,
				options: notification,
			},
			headers: {},
		};

		if (token && this.options.getAuthorization) {
			data.headers.Authorization = this.options.getAuthorization();
		}

		const response = await HTTP.post(`${ gateway }/push/${ service }/send`, data);

		if (response.statusCode === 406) {
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

		if (response.statusCode === 422) {
			logger.info('gateway rejected push notification. not retrying.', response);
			return;
		}

		if (response.statusCode === 401) {
			logger.warn('Error sending push to gateway (not authorized)', response);
			return;
		}

		if (response.statusCode === 200) {
			return;
		}

		logger.error(`Error sending push to gateway (${ tries } try) ->`, response);

		if (tries <= 4) {
			// [1, 2, 4, 8, 16] minutes (total 31)
			const ms = 60000 * Math.pow(2, tries);

			logger.log('Trying sending push to gateway again in', ms, 'milliseconds');

			return Meteor.setTimeout(() => this.sendGatewayPush(gateway, service, token, notification, tries + 1), ms);
		}
	}

	sendNotificationGateway(app, notification, countApn, countGcm) {
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

	sendNotification(notification = { badge: 0 }) {
		logger.debug('Sending notification', notification);

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

		logger.debug(`send message "${ notification.title }" to userId`, notification.userId);

		const query = {
			userId: notification.userId,
			$or: [
				{ 'token.apn': { $exists: true } },
				{ 'token.gcm': { $exists: true } },
			],
		};

		appTokensCollection.find(query).forEach((app) => {
			logger.debug('send to token', app.token);

			if (this._shouldUseGateway()) {
				return this.sendNotificationGateway(app, notification, countApn, countGcm);
			}

			return this.sendNotificationNative(app, notification, countApn, countGcm);
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
			userId: String,
			payload: Match.Optional(Object),
			delayUntil: Match.Optional(Date),
			createdAt: Date,
			createdBy: Match.OneOf(String, null),
		});

		if (!notification.userId) {
			throw new Error('No userId found');
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
		}, _.pick(options, 'from', 'title', 'text', 'userId'));

		// Add extra
		Object.assign(notification, _.pick(options, 'payload', 'badge', 'sound', 'notId', 'delayUntil', 'android_channel_id'));

		if (Match.test(options.apn, Object)) {
			notification.apn = _.pick(options.apn, 'from', 'title', 'text', 'badge', 'sound', 'notId', 'category');
		}

		if (Match.test(options.gcm, Object)) {
			notification.gcm = _.pick(options.gcm, 'image', 'style', 'summaryText', 'picture', 'from', 'title', 'text', 'badge', 'sound', 'notId', 'actions', 'android_channel_id');
		}

		if (options.contentAvailable != null) {
			notification.contentAvailable = options.contentAvailable;
		}

		if (options.forceStart != null) {
			notification.forceStart = options.forceStart;
		}

		// Validate the notification
		this._validateDocument(notification);

		try {
			this.sendNotification(notification);
		} catch (error) {
			logger.debug(`Could not send notification id: "${ notification._id }", Error: ${ error.message }`);
			logger.debug(error.stack);
		}
	}
}

export const Push = new PushClass();

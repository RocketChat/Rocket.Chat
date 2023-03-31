import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import _ from 'underscore';
import { AppsTokens } from '@rocket.chat/models';

import { initAPN, sendAPN } from './apn';
import { sendGCM } from './gcm';
import { logger } from './logger';
import { settings } from '../../settings/server';
import { fetch } from '../../../server/lib/http/fetch';

export const _matchToken = Match.OneOf({ apn: String }, { gcm: String });

class PushClass {
	options = {};

	isConfigured = false;

	configure(options) {
		this.options = Object.assign(
			{
				sendTimeout: 60000, // Timeout period for notification send
			},
			options,
		);
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
		logger.debug(`Send worker started, using interval: ${interval}`);

		return Meteor.setInterval(() => {
			try {
				task();
			} catch (error) {
				logger.debug(`Error while sending: ${error.message}`);
			}
		}, interval);
	}

	_replaceToken(currentToken, newToken) {
		void AppsTokens.updateMany({ token: currentToken }, { $set: { token: newToken } });
	}

	_removeToken(token) {
		void AppsTokens.deleteOne({ token });
	}

	_shouldUseGateway() {
		return !!this.options.gateways && settings.get('Register_Server') && settings.get('Cloud_Service_Agree_PrivacyTerms');
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
				sendGCM({
					userTokens: app.token.gcm,
					notification,
					_replaceToken: this._replaceToken,
					_removeToken: this._removeToken,
					options: this.options,
				});
			}
		} else {
			throw new Error('send got a faulty query');
		}
	}

	async sendGatewayPush(gateway, service, token, notification, tries = 0) {
		notification.uniqueId = this.options.uniqueId;

		const data = {
			body: JSON.stringify({
				token,
				options: notification,
			}),
			headers: {},
		};

		if (token && this.options.getAuthorization) {
			data.headers.Authorization = await this.options.getAuthorization();
		}

		const result = await fetch(`${gateway}/push/${service}/send`, { ...data, method: 'POST' });
		const response = await result.json();

		if (result.status === 406) {
			logger.info('removing push token', token);
			await AppsTokens.deleteMany({
				$or: [
					{
						'token.apn': token,
					},
					{
						'token.gcm': token,
					},
				],
			});
			return;
		}

		if (result.status === 422) {
			logger.info('gateway rejected push notification. not retrying.', response);
			return;
		}

		if (result.status === 401) {
			logger.warn('Error sending push to gateway (not authorized)', response);
			return;
		}

		if (result.ok) {
			return;
		}

		logger.error({ msg: `Error sending push to gateway (${tries} try) ->`, err: response });

		if (tries <= 4) {
			// [1, 2, 4, 8, 16] minutes (total 31)
			const ms = 60000 * Math.pow(2, tries);

			logger.log('Trying sending push to gateway again in', ms, 'milliseconds');

			return Meteor.setTimeout(() => this.sendGatewayPush(gateway, service, token, notification, tries + 1), ms);
		}
	}

	async sendNotificationGateway(app, notification, countApn, countGcm) {
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

	async sendNotification(notification = { badge: 0 }) {
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

		logger.debug(`send message "${notification.title}" to userId`, notification.userId);

		const query = {
			userId: notification.userId,
			$or: [{ 'token.apn': { $exists: true } }, { 'token.gcm': { $exists: true } }],
		};

		await AppsTokens.find(query).forEach((app) => {
			logger.debug('send to token', app.token);

			if (this._shouldUseGateway()) {
				return this.sendNotificationGateway(app, notification, countApn, countGcm);
			}

			return this.sendNotificationNative(app, notification, countApn, countGcm);
		});

		if (settings.get('Log_Level') === '2') {
			logger.debug(`Sent message "${notification.title}" to ${countApn.length} ios apps ${countGcm.length} android apps`);

			// Add some verbosity about the send result, making sure the developer
			// understands what just happened.
			if (!countApn.length && !countGcm.length) {
				if ((await AppsTokens.col.estimatedDocumentCount()) === 0) {
					logger.debug('GUIDE: The "AppsTokens" is empty - No clients have registered on the server yet...');
				}
			} else if (!countApn.length) {
				if ((await AppsTokens.col.countDocuments({ 'token.apn': { $exists: true } })) === 0) {
					logger.debug('GUIDE: The "AppsTokens" - No APN clients have registered on the server yet...');
				}
			} else if (!countGcm.length) {
				if ((await AppsTokens.col.countDocuments({ 'token.gcm': { $exists: true } })) === 0) {
					logger.debug('GUIDE: The "AppsTokens" - No GCM clients have registered on the server yet...');
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

	async send(options) {
		// If on the client we set the user id - on the server we need an option
		// set or we default to "<SERVER>" as the creator of the notification
		// If current user not set see if we can set it to the logged in user
		// this will only run on the client if Meteor.userId is available
		const currentUser = options.createdBy || '<SERVER>';

		// Rig the notification object
		const notification = Object.assign(
			{
				createdAt: new Date(),
				createdBy: currentUser,
				sent: false,
				sending: 0,
			},
			_.pick(options, 'from', 'title', 'text', 'userId'),
		);

		// Add extra
		Object.assign(notification, _.pick(options, 'payload', 'badge', 'sound', 'notId', 'delayUntil', 'android_channel_id'));

		if (Match.test(options.apn, Object)) {
			notification.apn = _.pick(options.apn, 'from', 'title', 'text', 'badge', 'sound', 'notId', 'category');
		}

		if (Match.test(options.gcm, Object)) {
			notification.gcm = _.pick(
				options.gcm,
				'image',
				'style',
				'summaryText',
				'picture',
				'from',
				'title',
				'text',
				'badge',
				'sound',
				'notId',
				'actions',
				'android_channel_id',
			);
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
			await this.sendNotification(notification);
		} catch (error) {
			logger.debug(`Could not send notification id: "${notification._id}", Error: ${error.message}`);
			logger.debug(error.stack);
		}
	}
}

export const Push = new PushClass();

import apn from 'apn';
import { EJSON } from 'meteor/ejson';

import { logger } from './logger';

let apnConnection;

export const sendAPN = ({ userToken, notification, _removeToken }) => {
	if (typeof notification.apn === 'object') {
		notification = Object.assign({}, notification, notification.apn);
	}

	const priority = notification.priority || notification.priority === 0 ? notification.priority : 10;

	const note = new apn.Notification();

	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = notification.badge;
	note.sound = notification.sound;

	if (notification.contentAvailable != null) {
		note.setContentAvailable(notification.contentAvailable);
	}

	// adds category support for iOS8 custom actions as described here:
	// https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/
	// RemoteNotificationsPG/Chapters/IPhoneOSClientImp.html#//apple_ref/doc/uid/TP40008194-CH103-SW36
	note.category = notification.category;

	note.body = notification.text;
	note.title = notification.title;

	if (notification.notId != null) {
		note.threadId = String(notification.notId);
	}

	// Allow the user to set payload data
	note.payload = notification.payload ? { ejson: EJSON.stringify(notification.payload) } : {};

	note.payload.messageFrom = notification.from;
	note.priority = priority;

	// Store the token on the note so we can reference it if there was an error
	note.token = userToken;
	note.topic = notification.topic;
	note.mutableContent = 1;

	apnConnection.send(note, userToken).then((response) => {
		response.failed.forEach((failure) => {
			logger.debug(`Got error code ${failure.status} for token ${userToken}`);

			if (['400', '410'].includes(failure.status)) {
				logger.debug(`Removing token ${userToken}`);
				_removeToken({
					apn: userToken,
				});
			}
		});
	});
};

export const initAPN = ({ options, absoluteUrl }) => {
	logger.debug('APN configured');

	// Allow production to be a general option for push notifications
	if (options.production === Boolean(options.production)) {
		options.apn.production = options.production;
	}

	// Give the user warnings about development settings
	if (options.apn.development) {
		// This flag is normally set by the configuration file
		logger.warn('WARNING: Push APN is using development key and certificate');
	} else if (options.apn.gateway) {
		// We check the apn gateway i the options, we could risk shipping
		// server into production while using the production configuration.
		// On the other hand we could be in development but using the production
		// configuration. And finally we could have configured an unknown apn
		// gateway (this could change in the future - but a warning about typos
		// can save hours of debugging)
		//
		// Warn about gateway configurations - it's more a guide

		if (options.apn.gateway === 'gateway.sandbox.push.apple.com') {
			// Using the development sandbox
			logger.warn('WARNING: Push APN is in development mode');
		} else if (options.apn.gateway === 'gateway.push.apple.com') {
			// In production - but warn if we are running on localhost
			if (/http:\/\/localhost/.test(absoluteUrl)) {
				logger.warn('WARNING: Push APN is configured to production mode - but server is running from localhost');
			}
		} else {
			// Warn about gateways we dont know about
			logger.warn(`WARNING: Push APN unknown gateway "${options.apn.gateway}"`);
		}
	} else if (options.apn.production) {
		if (/http:\/\/localhost/.test(absoluteUrl)) {
			logger.warn('WARNING: Push APN is configured to production mode - but server is running from localhost');
		}
	} else {
		logger.warn('WARNING: Push APN is in development mode');
	}

	// Check certificate data
	if (!options.apn.cert || !options.apn.cert.length) {
		logger.error('ERROR: Push server could not find cert');
	}

	// Check key data
	if (!options.apn.key || !options.apn.key.length) {
		logger.error('ERROR: Push server could not find key');
	}

	// Rig apn connection
	try {
		apnConnection = new apn.Provider(options.apn);
	} catch (err) {
		logger.error({ msg: 'Error trying to initialize APN', err });
	}
};

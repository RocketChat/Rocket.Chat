import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { EJSON } from 'meteor/ejson';
import _ from 'underscore';
import apn from 'apn';

import { logger } from './logger';

let apnConnection;

export const sendAPN = function(userToken, notification) {
	if (Match.test(notification.apn, Object)) {
		notification = _.extend({}, notification, notification.apn);
	}

	// console.log('sendAPN', notification.from, userToken, notification.title, notification.text,
	// notification.badge, notification.priority);
	const priority = notification.priority || notification.priority === 0 ? notification.priority : 10;

	const myDevice = new apn.Device(userToken);

	const note = new apn.Notification();

	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	if (typeof notification.badge !== 'undefined') {
		note.badge = notification.badge;
	}
	if (typeof notification.sound !== 'undefined') {
		note.sound = notification.sound;
	}
	// console.log(notification.contentAvailable);
	// console.log("lala2");
	// console.log(notification);
	if (typeof notification.contentAvailable !== 'undefined') {
		// console.log("lala");
		note.setContentAvailable(notification.contentAvailable);
		// console.log(note);
	}

	// adds category support for iOS8 custom actions as described here:
	// https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/
	// RemoteNotificationsPG/Chapters/IPhoneOSClientImp.html#//apple_ref/doc/uid/TP40008194-CH103-SW36
	if (typeof notification.category !== 'undefined') {
		note.category = notification.category;
	}

	note.alert = {
		body: notification.text,
	};

	if (typeof notification.title !== 'undefined') {
		note.alert.title = notification.title;
	}

	// Allow the user to set payload data
	note.payload = notification.payload ? { ejson: EJSON.stringify(notification.payload) } : {};

	note.payload.messageFrom = notification.from;
	note.priority = priority;


	// Store the token on the note so we can reference it if there was an error
	note.token = userToken;

	// console.log('I:Send message to: ' + userToken + ' count=' + count);

	apnConnection.pushNotification(note, myDevice);
};

// Init feedback from apn server
// This will help keep the appCollection up-to-date, it will help update
// and remove token from appCollection.
export const initFeedback = function({ options, _removeToken }) {
	// console.log('Init feedback');
	const feedbackOptions = {
		batchFeedback: true,

		// Time in SECONDS
		interval: 5,
		production: !options.apn.development,
		cert: options.certData,
		key: options.keyData,
		passphrase: options.passphrase,
	};

	const feedback = new apn.Feedback(feedbackOptions);
	feedback.on('feedback', function(devices) {
		devices.forEach(function(item) {
			// Do something with item.device and item.time;
			// console.log('A:PUSH FEEDBACK ' + item.device + ' - ' + item.time);
			// The app is most likely removed from the device, we should
			// remove the token
			_removeToken({
				apn: item.device,
			});
		});
	});

	feedback.start();
};

export const initAPN = ({ options, _removeToken }) => {
	logger.debug('Push: APN configured');

	// Allow production to be a general option for push notifications
	if (options.production === Boolean(options.production)) {
		options.apn.production = options.production;
	}

	// Give the user warnings about development settings
	if (options.apn.development) {
		// This flag is normally set by the configuration file
		console.warn('WARNING: Push APN is using development key and certificate');
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
			console.warn('WARNING: Push APN is in development mode');
		} else if (options.apn.gateway === 'gateway.push.apple.com') {
			// In production - but warn if we are running on localhost
			if (/http:\/\/localhost/.test(Meteor.absoluteUrl())) {
				console.warn('WARNING: Push APN is configured to production mode - but server is running from localhost');
			}
		} else {
			// Warn about gateways we dont know about
			console.warn(`WARNING: Push APN unkown gateway "${ options.apn.gateway }"`);
		}
	} else if (options.apn.production) {
		if (/http:\/\/localhost/.test(Meteor.absoluteUrl())) {
			console.warn('WARNING: Push APN is configured to production mode - but server is running from localhost');
		}
	} else {
		console.warn('WARNING: Push APN is in development mode');
	}

	// Check certificate data
	if (!options.apn.certData || !options.apn.certData.length) {
		console.error('ERROR: Push server could not find certData');
	}

	// Check key data
	if (!options.apn.keyData || !options.apn.keyData.length) {
		console.error('ERROR: Push server could not find keyData');
	}

	// Rig apn connection
	apnConnection = new apn.Connection(options.apn);

	// Listen to transmission errors - should handle the same way as feedback.
	apnConnection.on('transmissionError', Meteor.bindEnvironment(function(errCode, notification/* , recipient*/) {
		logger.debug('Got error code %d for token %s', errCode, notification.token);

		if ([2, 5, 8].indexOf(errCode) >= 0) {
			// Invalid token errors...
			_removeToken({
				apn: notification.token,
			});
		}
	}));

	initFeedback({ options, _removeToken });
};

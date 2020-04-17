import { Match, check } from 'meteor/check';
import _ from 'underscore';

import { _matchToken, notificationsCollection } from './push';

// This is a general function to validate that the data added to notifications
// is in the correct format. If not this function will throw errors
const _validateDocument = function(notification) {
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
		apn: Match.Optional({
			from: Match.Optional(String),
			title: Match.Optional(String),
			text: Match.Optional(String),
			badge: Match.Optional(Match.Integer),
			sound: Match.Optional(String),
			notId: Match.Optional(Match.Integer),
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
};

export const send = function(options) {
	// If on the client we set the user id - on the server we need an option
	// set or we default to "<SERVER>" as the creator of the notification
	// If current user not set see if we can set it to the logged in user
	// this will only run on the client if Meteor.userId is available
	const currentUser = options.createdBy || '<SERVER>';

	// Rig the notification object
	const notification = _.extend({
		createdAt: new Date(),
		createdBy: currentUser,
	}, _.pick(options, 'from', 'title', 'text'));

	// Add extra
	_.extend(notification, _.pick(options, 'payload', 'badge', 'sound', 'notId', 'delayUntil'));

	if (Match.test(options.apn, Object)) {
		notification.apn = _.pick(options.apn, 'from', 'title', 'text', 'badge', 'sound', 'notId', 'category');
	}

	if (Match.test(options.gcm, Object)) {
		notification.gcm = _.pick(options.gcm, 'image', 'style', 'summaryText', 'picture', 'from', 'title', 'text', 'badge', 'sound', 'notId');
	}

	// Set one token selector, this can be token, array of tokens or query
	if (options.query) {
		// Set query to the json string version fixing #43 and #39
		notification.query = JSON.stringify(options.query);
	} else if (options.token) {
		// Set token
		notification.token = options.token;
	} else if (options.tokens) {
		// Set tokens
		notification.tokens = options.tokens;
	}
	// console.log(options);
	if (typeof options.contentAvailable !== 'undefined') {
		notification.contentAvailable = options.contentAvailable;
	}

	notification.sent = false;
	notification.sending = 0;

	// Validate the notification
	_validateDocument(notification);

	// Try to add the notification to send, we return an id to keep track
	return notificationsCollection.insert(notification);
};

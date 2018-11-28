/* globals DDPRateLimiter */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	'livechat:sendOfflineMessage'(data) {
		check(data, {
			name: String,
			email: String,
			message: String,
		});

		return RocketChat.Livechat.sendOfflineMessage(data);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'livechat:sendOfflineMessage',
	connectionId() {
		return true;
	},
}, 1, 5000);

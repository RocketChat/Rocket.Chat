/* globals DDPRateLimiter */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	'livechat:sendTranscript'(token, rid, email) {
		check(rid, String);
		check(email, String);

		return RocketChat.Livechat.sendTranscript({ token, rid, email });
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'livechat:sendTranscript',
	connectionId() {
		return true;
	},
}, 1, 5000);

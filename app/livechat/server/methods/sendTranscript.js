import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:sendTranscript'(token, rid, email) {
		check(rid, String);
		check(email, String);

		return Livechat.sendTranscript({ token, rid, email });
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'livechat:sendTranscript',
	connectionId() {
		return true;
	},
}, 1, 5000);

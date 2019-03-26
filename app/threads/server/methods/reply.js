import { Meteor } from 'meteor/meteor';
import { RateLimiter } from '../../../lib';
import { hasPermission } from '../../../authorization';

Meteor.methods({
	'reply'({ mid, msg }) {
		console.log(mid, msg);
	},
});

RateLimiter.limitMethod('reply', 5, 1000, {
	userId(userId) {
		return !hasPermission(userId, 'send-many-messages');
	},
});

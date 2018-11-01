/* globals Mailer */
import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

Meteor.methods({
	'Mailer:unsubscribe'(_id, createdAt) {
		return Mailer.unsubscribe(_id, createdAt);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'Mailer:unsubscribe',
	connectionId() {
		return true;
	},
}, 1, 60000);

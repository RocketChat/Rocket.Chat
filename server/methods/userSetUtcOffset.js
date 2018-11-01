import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

Meteor.methods({
	userSetUtcOffset(utcOffset) {
		check(utcOffset, Number);

		if (this.userId == null) {
			return;
		}

		this.unblock();

		return RocketChat.models.Users.setUtcOffset(this.userId, utcOffset);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'userSetUtcOffset',
	userId() {
		return true;
	},
}, 1, 60000);

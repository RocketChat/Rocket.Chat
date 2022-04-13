import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Users } from '../../app/models';

Meteor.methods({
	userSetUtcOffset(utcOffset) {
		check(utcOffset, Number);

		if (this.userId == null) {
			return;
		}

		return Users.setUtcOffset(this.userId, utcOffset);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'userSetUtcOffset',
		userId() {
			return true;
		},
	},
	1,
	60000,
);

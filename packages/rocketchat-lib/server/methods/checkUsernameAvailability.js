import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	checkUsernameAvailability(username) { /* microservice */
		check(username, String);
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
		}

		return RocketChat.Services.call('core.checkUsernameAvailability', { username, uid });
	},
});

RocketChat.RateLimiter.limitMethod('checkUsernameAvailability', 1, 1000, {
	userId() { return true; },
});

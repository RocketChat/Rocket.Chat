import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { sendTask } from '../functions';
import { RateLimiter } from '../lib';


Meteor.methods({
	sendTask(task) {
		check(task, Object);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendTask',
			});
		}

		try {
			return sendTask(uid, task);
		} catch (error) {
			if ((error.error || error.message) === 'error-not-allowed') {
				throw new Meteor.Error(error.error || error.message, error.reason, {
					method: 'sendTask',
				});
			}
		}
	},
});
// Limit a user, who does not have the "bot" role, to sending 5 msgs/second
RateLimiter.limitMethod('sendTask', 5, 1000, {
	userId(userId) {
		return !hasPermission(userId, 'send-many-messages');
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Tasks } from '../../../models/server';
import { RateLimiter } from '../../../lib/server';
import { settings } from '../../../settings/server';
import { followTask } from '../functions';

Meteor.methods({
	'followTask'({ mid }) {
		check(mid, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'followTask' });
		}

		if (mid && !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'followTask' });
		}

		const task = Tasks.findOneById(mid, { fields: { rid: 1, tmid: 1 } });

		if (!task) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { method: 'followTask' });
		}

		const room = Meteor.call('canAccessRoom', task.rid, uid);
		if (!room) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'followTask' });
		}

		return followTask({ tmid: task.tmid || task._id, uid });
	},
});

RateLimiter.limitMethod('followTask', 5, 5000, {
	userId() { return true; },
});

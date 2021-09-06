import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Tasks } from '../../../models';

Meteor.methods({
	getSingleTask(taskId) {
		check(taskId, String);

		const task = Tasks.findOneById(taskId);

		if (!task || !task.rid) {
			return undefined;
		}

		if (!Meteor.call('canAccessRoom', task.rid, Meteor.userId())) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleTask' });
		}

		return task;
	},
});

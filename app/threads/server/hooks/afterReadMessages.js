import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../callbacks/server';
import { settings } from '../../../settings';
import { readAllThreads } from '../../lib/Thread';

const readThreads = (rid, { userId }) => {
	readAllThreads(rid, userId);
};

Meteor.startup(function() {
	settings.get('Threads_enabled', function(key, value) {
		if (!value) {
			callbacks.remove('afterReadMessages', 'threads-after-read-messages');
			return;
		}
		callbacks.add('afterReadMessages', readThreads, callbacks.priority.LOW, 'threads-after-read-messages');
	});
});

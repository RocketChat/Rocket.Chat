import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../callbacks/server';
import { settings } from '../../../settings/server';
import { Messages } from '../../../models/server';
import { undoReply } from '../functions';

Meteor.startup(function() {
	const fn = function(message) {
		// is a reply from a thread
		if (message.tmid) {
			undoReply(message);
		}

		// is a thread
		if (message.tcount) {
			Messages.removeThreadRefByThreadId(message._id);
		}

		return message;
	};

	settings.get('Threads_enabled', function(key, value) {
		if (!value) {
			callbacks.remove('afterDeleteMessage', 'threads-after-delete-message');
			return;
		}
		callbacks.add('afterDeleteMessage', fn, callbacks.priority.LOW, 'threads-after-delete-message');
	});
});

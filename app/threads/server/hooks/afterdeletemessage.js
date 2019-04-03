import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../callbacks/server';
import { settings } from '../../../settings';
import { undoReply } from '../../lib/Thread';
import { Messages } from '../../../models';
import { deleteMessage } from '../../../lib/server/functions/deleteMessage';

Meteor.startup(function() {
	const fn = function(message, room, user) {
		if (message.tmid) {
			undoReply(message.tmid);
		}

		if (message.tcount) {
			Messages.findRepliesByThreadId(message.tmid).forEach((message) => deleteMessage(message, user));
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

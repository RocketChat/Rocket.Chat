import { Meteor } from 'meteor/meteor';
import { parser } from '@rocket.chat/message-parser';

import { Tasks, Rooms } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { parseUrlsInMessage } from './parseUrlsInMessage';

const { DISABLE_MESSAGE_PARSER = 'false' } = process.env;

export const updateTask = function(task, user) {
	if (settings.get('Message_KeepHistory')) {
		Tasks.cloneAndSaveAsHistoryById(task._id, user);
	}

	task.editedAt = new Date();
	task.editedBy = {
		_id: user._id,
		username: user.username,
	};

	parseUrlsInMessage(task);

	task = callbacks.run('beforeSaveMessage', task);

	try {
		if (task.title && DISABLE_MESSAGE_PARSER !== 'true') {
			task.md = parser(task.title);
		}
	} catch (e) {
		console.log(e); // errors logged while the parser is at experimental stage
	}

	const tempid = task._id;
	delete task._id;

	Tasks.update({ _id: tempid }, { $set: task });

	const room = Rooms.findOneById(task.rid);

	Meteor.defer(function() {
		callbacks.run('afterSaveTask', Tasks.findOneById(tempid), room, user._id);
	});
};

import { Match } from 'meteor/check';
import { parser } from '@rocket.chat/message-parser';

import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { Tasks } from '../../../models';
import { parseUrlsInMessage } from './parseUrlsInMessage';
import { validateMessage } from './sendMessage';

const { DISABLE_MESSAGE_PARSER = 'false' } = process.env;

export const sendTask = function(user, task, room, upsert = false) {
	if (!user || !task || !room._id) {
		return false;
	}

	validateMessage(task, room, user);

	if (!task.ts) {
		task.ts = new Date();
	}

	if (task.tshow !== true) {
		delete task.tshow;
	}

	const { _id, username, name } = user;
	task.u = {
		_id,
		username,
		name,
	};
	task.rid = room._id;

	if (!Match.test(task.title, String)) {
		task.title = '';
	}

	if (task.ts == null) {
		task.ts = new Date();
	}

	if (settings.get('Message_Read_Receipt_Enabled')) {
		task.unread = true;
	}

	// For the Rocket.Chat Apps :)
	// if (Apps && Apps.isLoaded()) {
	// 	const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentPrevent', message));
	// 	if (prevent) {
	// 		if (settings.get('Apps_Framework_Development_Mode')) {
	// 			console.log('A Rocket.Chat App prevented the message sending.', message);
	// 		}

	// 		return;
	// 	}

	// 	let result;
	// 	result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentExtend', message));
	// 	result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentModify', result));

	// 	if (typeof result === 'object') {
	// 		message = Object.assign(message, result);

	// 		// Some app may have inserted malicious/invalid values in the message, let's check it again
	// 		validateMessage(message, room, user);
	// 	}
	// }

	parseUrlsInMessage(task);

	task = callbacks.run('beforeSaveMessage', task, room);
	try {
		if (task.title && DISABLE_MESSAGE_PARSER !== 'true') {
			task.md = parser(task.title);
		}
	} catch (e) {
		console.log(e); // errors logged while the parser is at experimental stage
	}
	if (task) {
		if (task._id && upsert) {
			const { _id } = task;
			delete task._id;
			Tasks.upsert({
				_id,
				'u._id': task.u._id,
			}, task);
			task._id = _id;
		} else {
			const taskAlreadyExists = task._id && Tasks.findOneById(task._id, { fields: { _id: 1 } });
			if (taskAlreadyExists) {
				return;
			}
			task._id = Tasks.insert(task);
		}

		// if (Apps && Apps.isLoaded()) {
		// 	// This returns a promise, but it won't mutate anything about the message
		// 	// so, we don't really care if it is successful or fails
		// 	Apps.getBridges().getListenerBridge().messageEvent('IPostMessageSent', message);
		// }

		// Execute all callbacks
		callbacks.runAsync('afterSaveTask', task, room, user._id);
		return task;
	}
};

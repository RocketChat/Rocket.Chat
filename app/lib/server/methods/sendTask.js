import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';

import { hasPermission } from '../../../authorization';
import { Users } from '../../../models';
import { sendTask } from '../functions';
import { RateLimiter } from '../lib';
import { canSendMessage } from '../../../authorization/server';
import { SystemLogger } from '../../../logger/server';
import { api } from '../../../../server/sdk/api';

export function executeSendTask(uid, task) {
	if (task.tshow && !task.tmid) {
		throw new Meteor.Error('invalid-params', 'tshow provided but missing tmid', {
			method: 'sendTask',
		});
	}

	if (task.ts) {
		const tsDiff = Math.abs(moment(task.ts).diff());
		if (tsDiff > 60000) {
			throw new Meteor.Error('error-task-ts-out-of-sync', 'Task timestamp is out of sync', {
				method: 'sendTask',
				task_ts: task.ts,
				server_ts: new Date().getTime(),
			});
		} else if (tsDiff > 10000) {
			task.ts = new Date();
		}
	} else {
		task.ts = new Date();
	}

	const user = Users.findOneById(uid, {
		fields: {
			username: 1,
			type: 1,
		},
	});
	const { rid } = task;


	if (!rid) {
		throw new Error('The \'rid\' property on the message object is missing.');
	}

	try {
		const room = canSendMessage(rid, { uid, username: user.username, type: user.type });
		return sendTask(user, task, room, false);
	} catch (error) {
		SystemLogger.error('Error sending message:', error);

		const errorMessage = typeof error === 'string' ? error : error.error || error.message;
		api.broadcast('notify.ephemeralMessage', uid, task.rid, {
			msg: TAPi18n.__(errorMessage, {}, user.language),
		});

		if (typeof error === 'string') {
			throw new Error(error);
		}

		throw error;
	}
}

Meteor.methods({
	sendTask(task) {
		check(task, Object);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendMessage',
			});
		}

		try {
			return executeSendTask(uid, task);
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

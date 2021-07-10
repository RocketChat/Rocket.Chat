import { FilterQuery } from 'mongodb';
import { TimeSync } from 'meteor/mizzao:timesync';
import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { Match, check } from 'meteor/check';
import s from 'underscore.string';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import moment from 'moment';
import toastr from 'toastr';

import { Rooms, Subscriptions, Tasks, Users } from '../../../models/server';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks/server';
import { promises } from '../../../promises/server';
import { updateTask, sendTask } from '../../../lib/server/functions';
import { API } from '../api';
import { TaskRoom } from '../../../../server/sdk';
import { hasAtLeastOnePermission, hasPermission, canSendMessage } from '../../../authorization/server';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { IUser } from '../../../../definition/IUser';

import Message from '/client/views/room/contextualBar/Discussions/components/Message';


API.v1.addRoute('taskRoom.create', { authRequired: true }, {
	post() {
		//  Permission_taskRoom
		if (!hasPermission(this.userId, 'create-team')) {
			return API.v1.unauthorized();
		}
		const { name, type, members, room, owner } = this.bodyParams;

		if (!name) {
			return API.v1.failure('Body param "name" is required');
		}

		const taskRoom = Promise.await(TaskRoom.create(this.userId, {
			taskRoom: {
				name,
				type,
			},
			room,
			members,
			owner,
		}));

		return API.v1.success({ taskRoom });
	},
});

API.v1.addRoute('taskRoom.taskDetails', { authRequired: true }, {
	get() {
		const { taskId } = this.queryParams;

		if (!taskId) {
			return API.v1.failure('task-does-not-exist');
		}

		// permission

		const messageDetails = Promise.await(Tasks.findOne({ _id: taskId }));

		return API.v1.success({ message: messageDetails });
	},
});

API.v1.addRoute('taskRoom.taskUpdate', { authRequired: true }, {
	post() {
		const { id, taskTitle, taskAssignee, taskDescription, taskStatus } = this.bodyParams;

		if (!id) {
			return API.v1.failure('task-does-not-exist');
		}

		// TO DO: permissions

		const task = Tasks.findOneById(id);

		if (!task || !task._id) {
			return;
		}

		const _hasPermission = hasPermission(Meteor.userId(), 'edit-message', task.rid);

		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = task.u && task.u._id === Meteor.userId();

		if (!_hasPermission && (!editAllowed || !editOwn)) {
			throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', { method: 'updateMessage', action: 'Message_editing' });
		}

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
		if (Match.test(blockEditInMinutes, Number) && blockEditInMinutes !== 0) {
			let currentTsDiff;
			let taskTs;

			if (Match.test(task.ts, Number)) {
				taskTs = moment(task.ts);
			}
			if (taskTs) {
				currentTsDiff = moment().diff(taskTs, 'minutes');
			}

			if (currentTsDiff > blockEditInMinutes) {
				throw new Meteor.Error('error-message-editing-blocked', 'Message editing is blocked', { method: 'updateMessage' });
			}
		}

		const user = this.userId;
		// canSendMessage(task.rid, { uid: user._id, ...user });

		// It is possible to have an empty array as the attachments property, so ensure both things exist
		if (task.attachments && task.attachments.length > 0 && task.attachments[0].description !== undefined) {
			task.attachments = task.attachments;
			task.attachments[0].description = task.title;
		}

		if (taskStatus) {
			task.taskStatus = taskStatus;
		}

		if (taskDescription) {
			task.taskDescription = taskDescription;
		}

		if (taskTitle) {
			task.title = taskTitle;
		}

		if (taskAssignee) {
			task.taskAssignee = taskAssignee;
		}

		updateTask(task, Meteor.user());

		return API.v1.success();
	},
});

API.v1.addRoute('taskRoom.createTask', { authRequired: true }, {
	post() {
		const task = this.bodyParams;

		const uid = this.userId;

		if (!uid || s.trim(task.title) === '') {
			return false;
		}
		if (task.tshow && !task.tmid) {
			return API.v1.failure('tshow provided but missing tmid');
		}

		if (task.tmid && !settings.get('Threads_enabled')) {
			return API.v1.failure('not-allowed');
		}

		if (task.ts) {
			const tsDiff = Math.abs(moment(task.ts).diff());
			if (tsDiff > 60000) {
				throw new Meteor.Error('error-message-ts-out-of-sync', 'Message timestamp is out of sync', {
					method: 'sendMessage',
					taskTs: task.ts,
					serverTs: new Date().getTime(),
				});
			} else if (tsDiff > 10000) {
				task.ts = new Date();
			}
		} else {
			task.ts = new Date();
		}

		// if (task.title) {
		// 	const adjustedMessage = messageProperties.messageWithoutEmojiShortnames(task.title);

		// 	if (messageProperties.length(adjustedMessage) > settings.get('Message_MaxAllowedSize')) {
		// 		throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
		// 			method: 'sendMessage',
		// 		});
		// 	}
		// }

		const user = Users.findOneById(uid, {
			fields: {
				username: 1,
				type: 1,
			},
		});
		const { rid } = task;

		if (!rid) {
			return API.v1.failure('the rid property is missing');
		}

		try {
			const room = canSendMessage(rid, { uid, username: user.username, type: user.type });
			sendTask(user, task, room, false);
		} catch (error) {
			return API.v1.failure('An error occured while creating a task');
		}

		return API.v1.success({ task });
	},
});


API.v1.addRoute('taskRoom.taskHistory', { authRequired: true }, {
	get() {
		const { rid } = this.queryParams;
		const room = Rooms.findOne(rid, { fields: { sysMes: 1 } });
		const hideSettings = {};
		const settingValues = Array.isArray(room.sysMes) ? room.sysMes : hideSettings.value || [];
		const hideMessagesOfType = new Set(settingValues.reduce((array: any, value: string) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []));
		const query = {
			rid,
			_hidden: { $ne: true },
		};

		if (hideMessagesOfType.size) {
			query.t = { $nin: Array.from(hideMessagesOfType.values()) };
		}

		const options = {
			sort: {
				ts: 1,
			},
		};

		const tasks = Promise.await(Tasks.find(query, options).fetch());
		return API.v1.success(tasks);
	},
});

API.v1.addRoute('taskRoom.followTask', { authRequired: true }, {
	post() {
		const { mid } = this.bodyParams;

		const uid = Meteor.userId();
		if (!uid) {
			API.v1.failure('Invalid user id');
		}

		if (mid && !settings.get('Threads_enabled')) {
			API.v1.failure('Not allowed');
		}

		const task = Tasks.findOneById(mid, { fields: { rid: 1, tmid: 1 } });

		if (!task) {
			API.v1.failure('Invalid task');
		}

		const room = Meteor.call('canAccessRoom', task.rid, uid);
		if (!room) {
			API.v1.failure('Not allowed to follow in this room');
		}

		Tasks.addThreadFollowerByThreadId({ tmid: task.tmid || task.id }, uid);

		return API.v1.success(true);
	},
});

API.v1.addRoute('taskRoom.unfollowTask', { authRequired: true }, {
	post() {
		const { mid } = this.bodyParams;

		const uid = Meteor.userId();
		if (!uid) {
			API.v1.failure('Invalid user id');
		}

		if (mid && !settings.get('Threads_enabled')) {
			API.v1.failure('Not allowed');
		}

		const task = Tasks.findOneById(mid, { fields: { rid: 1, tmid: 1 } });

		if (!task) {
			API.v1.failure('Invalid task');
		}

		const room = Meteor.call('canAccessRoom', task.rid, uid);
		if (!room) {
			API.v1.failure('Not allowed to follow in this room');
		}

		Subscriptions.removeUnreadThreadByRoomIdAndUserId({ rid: task.rid }, uid, { tmid: task.tmid || task.id });

		Tasks.removeThreadFollowerByThreadId({ tmid: task.tmid || task.id }, uid);

		return API.v1.success(true);
	},
});

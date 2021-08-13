import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { Match } from 'meteor/check';
import s from 'underscore.string';
import moment from 'moment';

import { Rooms, Subscriptions, Tasks, Users } from '../../../models/server';
import { canDeleteTask } from '../../../authorization/server/functions/canDeleteTask';
import { settings } from '../../../settings';
import { updateTask, sendTask, deleteTask } from '../../../lib/server/functions';
import { API } from '../api';
import { TaskRoom } from '../../../../server/sdk';
import { hasPermission, canSendMessage } from '../../../authorization/server';


API.v1.addRoute('taskRoom.create', { authRequired: true }, {
	post() {
		//  Permission_taskRoom
		if (!hasPermission(this.userId, 'create-taskRoom')) {
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

		const taskDetails = Promise.await(Tasks.findOne({ _id: taskId }));

		return API.v1.success({ task: taskDetails });
	},
});

API.v1.addRoute('taskRoom.taskUpdate', { authRequired: true }, {
	post() {
		const { id, taskTitle, taskAssignee, taskDescription, taskStatus } = this.bodyParams;

		if (!id) {
			return API.v1.failure('task-does-not-exist');
		}

		const task = Tasks.findOneById(id);

		const _hasPermission = hasPermission(this.userId, 'edit-task', task.rid);

		if (!task || !task._id) {
			return;
		}


		const editAllowed = settings.get('Task_AllowEditing');
		const editOwn = task.u && task.u._id === this.userId;

		if (!_hasPermission && (!editAllowed || !editOwn)) {
			API.v1.failure('An error occured while updating a task');
		}

		const blockEditInMinutes = settings.get('Task_AllowEditing_BlockEditInMinutes');
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
				API.v1.failure('An error occured while updating a task');
			}
		}
		const uid = this.userId;
		const user = Users.findOneById(uid, {
			fields: {
				username: 1,
				type: 1,
			},
		});
		canSendMessage(task.rid, { uid: user._id, ...user });

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
				API.v1.failure('error-task-ts-out-of-sync');
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
		const hideMessagesOfType = new Set(settingValues.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []));
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

		const task = Promise.await(Tasks.findOneById(mid, { fields: { rid: 1, tmid: 1 } }));
		if (!task) {
			API.v1.failure('Invalid task');
		}

		const room = Meteor.call('canAccessRoom', task.rid, uid);
		if (!room) {
			API.v1.failure('Not allowed to follow in this room');
		}

		Tasks.addThreadFollowerByThreadId(task._id, uid);

		return API.v1.success(task);
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

		const task = Promise.await(Tasks.findOneById(mid, { fields: { rid: 1, tmid: 1 } }));

		if (!task) {
			API.v1.failure('Invalid task');
		}

		const room = Meteor.call('canAccessRoom', task.rid, uid);
		if (!room) {
			API.v1.failure('Not allowed to follow in this room');
		}

		Subscriptions.removeUnreadThreadByRoomIdAndUserId(task.rid, uid, task._id || task.tmid);

		Tasks.removeThreadFollowerByThreadId(task.tmid || task._id, uid);

		return API.v1.success(task);
	},
});

API.v1.addRoute('taskRoom.deleteTask', { authRequired: true }, {
	post() {
		const { taskId } = this.bodyParams;

		const uid = Meteor.userId();

		if (!uid) {
			API.v1.failure('Invalid user id');
		}

		const originalTask = Tasks.findOneById(taskId, {
			fields: {
				u: 1,
				rid: 1,
				file: 1,
				ts: 1,
			},
		});

		if (!originalTask || !canDeleteTask(uid, originalTask)) {
			API.v1.failure('Not allowed to follow in this room');
		}

		const resp = Promise.await(deleteTask(originalTask, Meteor.user()));

		return resp;
	},
});

import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { Match } from 'meteor/check';
import s from 'underscore.string';
import moment from 'moment';
import { Random } from 'meteor/random';

import { Subscriptions, Tasks, Users } from '../../../models/server';
import { canDeleteTask } from '../../../authorization/server/functions/canDeleteTask';
import { settings } from '../../../settings';
import { updateTask, deleteTask, sendTask } from '../../../lib/server/functions';
import { API } from '../api';
import { TaskRoom } from '../../../../server/sdk';
import { hasPermission, canSendMessage } from '../../../authorization/server';


API.v1.addRoute('taskRoom.create', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'create-taskRoom')) {
			return API.v1.unauthorized();
		}
		const { name, type, members, room } = this.bodyParams;

		if (!name) {
			return API.v1.failure('Body param "name" is required');
		}

		if (type === 0 && !hasPermission(this.userId, 'create-c')) {
			return API.v1.unauthorized();
		}

		if (type === 1 && !hasPermission(this.userId, 'create-p')) {
			return API.v1.unauthorized();
		}

		const taskRoom = Promise.await(TaskRoom.create(this.userId, {
			taskRoom: {
				name,
				type,
			},
			room,
			members,
		}));

		return API.v1.success({ taskRoom });
	},
});

API.v1.addRoute('taskRoom.taskDetails', { authRequired: true }, {
	get() {
		const { taskId } = this.queryParams;

		if (!taskId) {
			return API.v1.failure('Missing id for the task');
		}

		const uid = this.userId;

		const taskDetails = Promise.await(Tasks.findOne({ _id: taskId }));

		if (!taskDetails) {
			return API.v1.failure('Task not found');
		}

		const room = Meteor.call('canAccessRoom', taskDetails.rid, uid);

		if (!room) {
			return API.v1.failure('Not allowed to follow in this room');
		}

		return API.v1.success(taskDetails);
	},
});

API.v1.addRoute('taskRoom.taskUpdate', { authRequired: true }, {
	post() {
		const { id, taskTitle, taskAssignee, taskDescription, taskStatus } = this.bodyParams;

		if (!id) {
			return API.v1.failure('Id is missing');
		}

		const task = Tasks.findOneById(id);

		if (!task || !task._id) {
			return API.v1.failure('Task not found');
		}

		const editPermission = hasPermission(this.userId, 'edit-task', task.rid);

		const editAllowed = settings.get('Task_AllowEditing');
		const editOwn = task.u && task.u._id === this.userId;

		if (!editPermission && (!editAllowed || !editOwn)) {
			return API.v1.failure('An error occured while updating a task');
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
				return API.v1.failure('An error occured while updating a task');
			}
		}
		const uid = this.userId;
		const user = Users.findOneById(uid, {
			fields: {
				username: 1,
				type: 1,
			},
		});

		try {
			canSendMessage(task.rid, { uid: user._id, ...user });
		} catch (error) {
			return API.v1.failure(error.message);
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

		return API.v1.success({ task });
	},
});

API.v1.addRoute('taskRoom.createTask', { authRequired: true }, {
	post() {
		const task = this.bodyParams;

		const uid = this.userId;

		if (!uid || s.trim(task.title) === '') {
			return API.v1.failure('task title is missing');
		}
		const { rid } = task;

		if (!rid) {
			return API.v1.failure('the rid property is missing');
		}

		const _hasPermission = hasPermission(this.userId, 'create-task', task.rid);

		if (!_hasPermission) {
			return API.v1.failure('Not authorized');
		}

		if (task.tshow && !task.tmid) {
			return API.v1.failure('tshow provided but missing tmid');
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

		task._id = Random.id();

		const user = Users.findOneById(uid, {
			fields: {
				username: 1,
				type: 1,
			},
		});

		try {
			const room = canSendMessage(rid, { uid, username: user.username, type: user.type });
			sendTask(user, task, room, false);
		} catch (error) {
			return API.v1.failure(error.message);
		}


		return API.v1.success({ task });
	},
});


API.v1.addRoute('taskRoom.taskHistory', { authRequired: true }, {
	get() {
		const { rid } = this.queryParams;

		if (!rid) {
			return API.v1.failure('Missing rid params');
		}

		if (!this.userId && settings.get('Accounts_AllowAnonymousRead') === false) {
			return API.v1.failure('Invalid user');
		}

		const room = Meteor.call('canAccessRoom', rid, this.userId);

		if (!room) {
			return API.v1.failure('Invalid permissions');
		}

		const canAnonymous = settings.get('Accounts_AllowAnonymousRead');
		const canPreview = hasPermission(this.userId, 'preview-c-room');

		if (room.t === 'c' && !canAnonymous && !canPreview && !Subscriptions.findOneByRoomIdAndUserId(rid, this.userId, { fields: { _id: 1 } })) {
			return false;
		}
		const query = {
			rid,
			_hidden: { $ne: true },
		};

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
			return API.v1.failure('Not allowed to follow in this room');
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
			return API.v1.failure('Not allowed to unfollow in this room');
		}

		Subscriptions.removeUnreadThreadByRoomIdAndUserId(task.rid, uid, task._id || task.tmid);

		Tasks.removeThreadFollowerByThreadId(task.tmid || task._id, uid);

		return API.v1.success(task);
	},
});

API.v1.addRoute('taskRoom.deleteTask', { authRequired: true }, {
	post() {
		const { taskId } = this.bodyParams;

		if (!taskId) {
			API.v1.failure('Invalid taskId');
		}

		const uid = Meteor.userId();

		if (!uid) {
			return API.v1.failure('Invalid user id');
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
			return API.v1.failure('Not allowed to delete tasks in this room');
		}

		deleteTask(originalTask, Meteor.user());

		return API.v1.success();
	},
});

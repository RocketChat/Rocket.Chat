import { FilterQuery } from 'mongodb';
import { TimeSync } from 'meteor/mizzao:timesync';
import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { Match, check, Match, check } from 'meteor/check';
import s from 'underscore.string';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import moment from 'moment';

import { settings } from '../../../settings';

import toastr from 'toastr';

import { updateMessage } from '../../../lib/server/functions';
import { API } from '../api';
import { TaskRoom } from '../../../../server/sdk';
import { hasAtLeastOnePermission, hasPermission, canSendMessage } from '../../../authorization/server';
import { Users, Messages, Tasks } from '../../../models/server';
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

		const messageDetails = Promise.await(Messages.findOne({ _id: taskId }));

		return API.v1.success({ message: messageDetails });
	},
});

API.v1.addRoute('taskRoom.taskUpdate', { authRequired: true }, {
	post() {
		const { id, taskTitle, taskAssignee, taskDescription, taskStatut } = this.bodyParams;

		if (!id) {
			return API.v1.failure('task-does-not-exist');
		}

		// TO DO: permissions

		const message = Messages.findOneById(id);

		if (!message || !message._id) {
			return;
		}

		const _hasPermission = hasPermission(Meteor.userId(), 'edit-message', message.rid);

		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = message.u && message.u._id === Meteor.userId();

		if (!_hasPermission && (!editAllowed || !editOwn)) {
			throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', { method: 'updateMessage', action: 'Message_editing' });
		}

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
		if (Match.test(blockEditInMinutes, Number) && blockEditInMinutes !== 0) {
			let currentTsDiff;
			let msgTs;

			if (Match.test(message.ts, Number)) {
				msgTs = moment(message.ts);
			}
			if (msgTs) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}

			if (currentTsDiff > blockEditInMinutes) {
				throw new Meteor.Error('error-message-editing-blocked', 'Message editing is blocked', { method: 'updateMessage' });
			}
		}

		const user = this.userId;
		canSendMessage(message.rid, { uid: user._id, ...user });

		// It is possible to have an empty array as the attachments property, so ensure both things exist
		if (message.attachments && message.attachments.length > 0 && message.attachments[0].description !== undefined) {
			message.attachments = message.attachments;
			message.attachments[0].description = message.msg;
			message.msg = message.msg;
		}

		if (taskStatut) {
			message.taskStatut = taskStatut;
		}

		if (taskDescription) {
			message.taskDescription = taskDescription;
		}

		if (taskTitle) {
			message.msg = taskTitle;
		}

		if (taskAssignee) {
			message.taskAssignee = taskAssignee;
		}

		updateMessage(message, Meteor.user());

		return API.v1.success();
	},
});

API.v1.addRoute('taskRoom.createTask', { authRequired: true }, {
	post() {
		const task = this.bodyParams;
		check(this.bodyParams, {
			title: String,
			rid: String,
		});
		console.log(task);
		if (!this.userId || s.trim(task.title) === '') {
			return false;
		}
		const taskAlreadyExists = task._id && Tasks.findOne({ _id: task._id });
		if (taskAlreadyExists) {
			return toastr.error('Task_Already_Sent');
		}
		const user = Meteor.user();
		// task.ts = isNaN(TimeSync.serverOffset()) ? new Date() : new Date(Date.now() + TimeSync.serverOffset());
		task.ts = new Date();
		task.u = {
			_id: this.userId,
			username: user?.username,
		};
		if (settings.get('UI_Use_Real_Name')) {
			task.u.name = user.name;
		}
		task.temp = true;
		if (settings.get('Message_Read_Receipt_Enabled')) {
			task.unread = true;
		}
		Tasks.insert(task);
		// task = callbacks.run('beforeSaveMessage', task);
		// promises.run('onClientMessageReceived', message).then(function(task) {
		// 	Tasks.insert(task);
		// 	return callbacks.run('afterSaveMessage', message);
		// });
		return API.v1.success({ task });
	},
});


API.v1.addRoute('taskRoom.loadHistory', { authRequired: true }, {
	get() {
		const { rid } = this.queryParams;

		return API.v1.success({ task });
	},
});

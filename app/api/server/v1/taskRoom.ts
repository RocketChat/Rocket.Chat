import { FilterQuery } from 'mongodb';
import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { Match, check, Match, check } from 'meteor/check';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import moment from 'moment';

import { settings } from '../../../settings';
import { updateMessage } from '../../../lib/server/functions';
import { API } from '../api';
import { TaskRoom } from '../../../../server/sdk';
import { hasAtLeastOnePermission, hasPermission, canSendMessage } from '../../../authorization/server';
import { Users, Messages } from '../../../models/server';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { IUser } from '../../../../definition/IUser';

import Message from '/client/views/room/contextualBar/Discussions/components/Message';

// API.v1.addRoute('teams.list', { authRequired: true }, {
// 	get() {
// 		const { offset, count } = this.getPaginationItems();
// 		const { sort, query } = this.parseJsonQuery();

// 		const { records, total } = Promise.await(TaskRoom.list(this.userId, { offset, count }, { sort, query }));

// 		return API.v1.success({
// 			teams: records,
// 			total,
// 			count: records.length,
// 			offset,
// 		});
// 	},
// });

// API.v1.addRoute('teams.listAll', { authRequired: true }, {
// 	get() {
// 		if (!hasPermission(this.userId, 'view-all-teams')) {
// 			return API.v1.unauthorized();
// 		}

// 		const { offset, count } = this.getPaginationItems();

// 		const { records, total } = Promise.await(TaskRoom.listAll({ offset, count }));

// 		return API.v1.success({
// 			teams: records,
// 			total,
// 			count: records.length,
// 			offset,
// 		});
// 	},
// });

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

		const user = Meteor.users.findOne(Meteor.userId());
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

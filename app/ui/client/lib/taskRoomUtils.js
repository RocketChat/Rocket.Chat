import { TimeSync } from 'meteor/mizzao:timesync';
import s from 'underscore.string';
import moment from 'moment';
import toastr from 'toastr';
import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { KonchatNotification } from './notification';
import { MsgTyping } from './msgTyping';
import { fileUpload } from './fileUpload';
import { t, slashCommands, handleError } from '../../../utils/client';
import {
	messageProperties,
	MessageTypes,
	readMessage,
	modal,
	call,
	keyCodes,
	prependReplies,
} from '../../../ui-utils/client';
import { settings } from '../../../settings/client';
import { callbacks } from '../../../callbacks/client';
import { promises } from '../../../promises/client';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { Messages, Rooms, ChatMessage, ChatSubscription, ChatTask, Tasks } from '../../../models/client';
import { emoji } from '../../../emoji/client';
import { generateTriggerId } from '../../../ui-message/client/ActionManager';


// Front-end
const processCreateTask = async (task) => {
	if (!Meteor.userId() || s.trim(task.title) === '') {
		return false;
	}
	const taskAlreadyExist = task._id && ChatTask.findOne({ _id: task._id });
	if (taskAlreadyExist) {
		return toastr.error(t('Task_Already_Sent'));
	}
	const user = Meteor.user();
	task.ts = isNaN(TimeSync.serverOffset()) ? new Date() : new Date(Date.now() + TimeSync.serverOffset());
	task.u = {
		_id: Meteor.userId(),
		username: user.username,
	};
	if (settings.get('UI_Use_Real_Name')) {
		task.u.name = user.name;
	}
	task.temp = true;
	if (settings.get('Message_Read_Receipt_Enabled')) {
		task.unread = true;
	}
	task._id = Random.id();
	task = callbacks.run('beforeSaveMessage', task);

	promises.run('onClientMessageReceived', task).then(function(task) {
		ChatTask.insert(task);
		return callbacks.run('afterSaveTask', task);
	});
	return task;
};
// Back-end
const createNewTask = (task) => {

};

const processUpdateTask = () => {

};

const updateTask = () => {

};

const processDeleteTask = () => {

};

const deleteTask = () => {

};

export const NewTaskRoom = {
	async createTask(rid, task, done = () => {}) {
		const sub = ChatSubscription.findOne({ rid });
		task._id = Random.id();
		if (!sub) {
			await call('joinRoom', rid);
		}
		const t = await processCreateTask(task);
		return t;
		// createNewTask(task);
	},

	updateTask(cb) {
		// Permissions
		processUpdateTask();
		updateTask();
	},

	deleteTask(cb) {
		// Permissions
		processDeleteTask();
		deleteTask();
	},
};

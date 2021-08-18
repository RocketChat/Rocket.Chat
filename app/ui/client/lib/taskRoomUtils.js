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
const processCreateTask = () => {

};
// Back-end
const sendTask = () => {

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
	async createTask(rid, cb) {
		// Permissions
		processCreateTask();
		sendTask();
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

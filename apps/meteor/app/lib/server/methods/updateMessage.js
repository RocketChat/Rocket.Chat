import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import moment from 'moment';

import { Messages } from '../../../models';
import { settings } from '../../../settings';
import { hasPermission, canSendMessage } from '../../../authorization/server';
import { updateMessage } from '../functions';

Meteor.methods({
	updateMessage(message) {
		check(message, Match.ObjectIncluding({ _id: String }));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateMessage' });
		}

		const originalMessage = Messages.findOneById(message._id);

		if (!originalMessage || !originalMessage._id) {
			return;
		}
		if (originalMessage.msg === message.msg) {
			return;
		}

		if (!!message.tmid && originalMessage._id === message.tmid) {
			throw new Meteor.Error('error-message-same-as-tmid', 'Cannot set tmid the same as the _id', {
				method: 'updateMessage',
			});
		}

		if (!originalMessage.tmid && !!message.tmid) {
			throw new Meteor.Error('error-message-change-to-thread', 'Cannot update message to a thread', { method: 'updateMessage' });
		}

		const _hasPermission = hasPermission(Meteor.userId(), 'edit-message', message.rid);
		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = originalMessage.u && originalMessage.u._id === Meteor.userId();

		if (!_hasPermission && (!editAllowed || !editOwn)) {
			throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', {
				method: 'updateMessage',
				action: 'Message_editing',
			});
		}

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
		if (Match.test(blockEditInMinutes, Number) && blockEditInMinutes !== 0) {
			let currentTsDiff;
			let msgTs;

			if (Match.test(originalMessage.ts, Number)) {
				msgTs = moment(originalMessage.ts);
			}
			if (msgTs) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			if (currentTsDiff > blockEditInMinutes) {
				throw new Meteor.Error('error-message-editing-blocked', 'Message editing is blocked', {
					method: 'updateMessage',
				});
			}
		}

		const user = Meteor.users.findOne(Meteor.userId());
		canSendMessage(message.rid, { uid: user._id, ...user });

		// It is possible to have an empty array as the attachments property, so ensure both things exist
		if (originalMessage.attachments && originalMessage.attachments.length > 0 && originalMessage.attachments[0].description !== undefined) {
			message.attachments = originalMessage.attachments;
			message.attachments[0].description = message.msg;
			message.msg = originalMessage.msg;
		}

		message.u = originalMessage.u;

		return updateMessage(message, Meteor.user(), originalMessage);
	},
});

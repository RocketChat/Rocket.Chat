import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import moment from 'moment';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IEditedMessage, IUser } from '@rocket.chat/core-typings';

import { Messages } from '../../../models/server';
import { settings } from '../../../settings/server';
import { canSendMessage } from '../../../authorization/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { updateMessage } from '../functions';

const allowedEditedFields = ['tshow', 'alias', 'attachments', 'avatar', 'emoji', 'msg'];

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		updateMessage(message: IEditedMessage): void;
	}
}

Meteor.methods<ServerMethods>({
	async updateMessage(message) {
		check(message, Match.ObjectIncluding({ _id: String }));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateMessage' });
		}

		const originalMessage = Messages.findOneById(message._id);
		if (!originalMessage?._id) {
			return;
		}

		Object.entries(message).forEach(([key, value]) => {
			if (!allowedEditedFields.includes(key) && value !== originalMessage[key]) {
				throw new Meteor.Error('error-invalid-update-key', `Cannot update the message ${key}`, {
					method: 'updateMessage',
				});
			}
		});

		const msgText = originalMessage?.attachments?.[0]?.description ?? originalMessage.msg;
		if (msgText === message.msg) {
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

		const _hasPermission = await hasPermissionAsync(uid, 'edit-message', message.rid);
		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = originalMessage.u && originalMessage.u._id === uid;

		if (!_hasPermission && (!editAllowed || !editOwn)) {
			throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', {
				method: 'updateMessage',
				action: 'Message_editing',
			});
		}

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
		const bypassBlockTimeLimit = await hasPermissionAsync(uid, 'bypass-time-limit-edit-and-delete');

		if (!bypassBlockTimeLimit && Match.test(blockEditInMinutes, Number) && blockEditInMinutes !== 0) {
			let currentTsDiff = 0;
			let msgTs;

			if (originalMessage.ts instanceof Date || Match.test(originalMessage.ts, Number)) {
				msgTs = moment(originalMessage.ts);
			}
			if (msgTs) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			if (currentTsDiff >= blockEditInMinutes) {
				throw new Meteor.Error('error-message-editing-blocked', 'Message editing is blocked', {
					method: 'updateMessage',
				});
			}
		}

		const user = Meteor.users.findOne(uid) as IUser;
		canSendMessage(message.rid, { uid: user._id, username: user.username ?? undefined, ...user });

		// It is possible to have an empty array as the attachments property, so ensure both things exist
		if (originalMessage.attachments && originalMessage.attachments.length > 0 && originalMessage.attachments[0].description !== undefined) {
			originalMessage.attachments[0].description = message.msg;
			message.attachments = originalMessage.attachments;
			message.msg = originalMessage.msg;
		}

		message.u = originalMessage.u;

		return updateMessage(message, user, originalMessage);
	},
});

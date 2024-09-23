import type { IEditedMessage, IMessage, IUser, AtLeast } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { canSendMessageAsync } from '../../../authorization/server/functions/canSendMessage';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { updateMessage } from '../functions/updateMessage';

const allowedEditedFields = ['tshow', 'alias', 'attachments', 'avatar', 'emoji', 'msg', 'customFields', 'content', 'e2eMentions'];

export async function executeUpdateMessage(
	uid: IUser['_id'],
	message: AtLeast<IMessage, '_id' | 'rid' | 'msg' | 'customFields'>,
	previewUrls?: string[],
) {
	const originalMessage = await Messages.findOneById(message._id);
	if (!originalMessage?._id) {
		return;
	}

	Object.entries(message).forEach(([key, value]) => {
		if (!allowedEditedFields.includes(key) && value !== originalMessage[key as keyof IMessage]) {
			throw new Meteor.Error('error-invalid-update-key', `Cannot update the message ${key}`, {
				method: 'updateMessage',
			});
		}
	});

	// IF the message has custom fields, always update
	// Ideally, we'll compare the custom fields to check for change, but since we don't know the shape of
	// custom fields, as it's user defined, we're gonna update
	const msgText = originalMessage?.attachments?.[0]?.description ?? originalMessage.msg;
	if (msgText === message.msg && !previewUrls && !message.customFields) {
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
	const bypassBlockTimeLimit = await hasPermissionAsync(uid, 'bypass-time-limit-edit-and-delete', message.rid);

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

	const user = await Users.findOneById(uid);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateMessage' });
	}
	await canSendMessageAsync(message.rid, { uid: user._id, username: user.username ?? undefined, ...user });

	// It is possible to have an empty array as the attachments property, so ensure both things exist
	if (originalMessage.attachments && originalMessage.attachments.length > 0 && originalMessage.attachments[0].description !== undefined) {
		originalMessage.attachments[0].description = message.msg;
		message.attachments = originalMessage.attachments;
		message.msg = originalMessage.msg;
	}

	message.u = originalMessage.u;

	return updateMessage(message, user, originalMessage, previewUrls);
}

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		updateMessage(message: IEditedMessage, previewUrls?: string[]): void;
	}
}

Meteor.methods<ServerMethods>({
	async updateMessage(message: IEditedMessage, previewUrls?: string[]) {
		check(message, Match.ObjectIncluding({ _id: String }));
		check(previewUrls, Match.Maybe([String]));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateMessage' });
		}

		return executeUpdateMessage(uid, message, previewUrls);
	},
});

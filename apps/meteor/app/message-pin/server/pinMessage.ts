import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IMessage, MessageAttachment, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { isQuoteAttachment } from '@rocket.chat/core-typings';
import { Messages as MessagesRaw } from '@rocket.chat/models';

import { settings } from '../../settings/server';
import { callbacks } from '../../../lib/callbacks';
import { isTheLastMessage } from '../../lib/server';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';
import { canAccessRoomAsync, roomAccessAttributes } from '../../authorization/server';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { Subscriptions, Messages, Users, Rooms } from '../../models/server';
import { Apps, AppEvents } from '../../../ee/server/apps/orchestrator';
import { isTruthy } from '../../../lib/isTruthy';

const recursiveRemove = (msg: MessageAttachment, deep = 1) => {
	if (!msg || !isQuoteAttachment(msg)) {
		return;
	}

	if (deep > (settings.get('Message_QuoteChainLimit') ?? 0)) {
		delete msg.attachments;
		return msg;
	}

	msg.attachments = Array.isArray(msg.attachments)
		? msg.attachments.map((nestedMsg) => recursiveRemove(nestedMsg, deep + 1)).filter(isTruthy)
		: undefined;

	return msg;
};

const shouldAdd = (attachments: MessageAttachment[], attachment: MessageQuoteAttachment) =>
	!attachments.some((_attachment) => isQuoteAttachment(_attachment) && _attachment.message_link === attachment.message_link);

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		pinMessage(message: IMessage, pinnedAt?: Date): Pick<IMessage, '_id' | 't' | 'rid' | 'ts' | 'msg' | 'u' | 'groupable'>;
		unpinMessage(message: IMessage): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async pinMessage(message, pinnedAt) {
		check(message._id, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'pinMessage',
			});
		}

		if (!settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		let originalMessage: IMessage = Messages.findOneById(message._id);
		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, userId, { fields: { _id: 1 } });
		if (!subscription) {
			// If it's a valid message but on a room that the user is not subscribed to, report that the message was not found.
			throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		if (!(await hasPermissionAsync(userId, 'pin-message', originalMessage.rid))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'pinMessage' });
		}

		const me = Users.findOneById(userId);

		// If we keep history of edits, insert a new message to store history information
		if (settings.get('Message_KeepHistory')) {
			await MessagesRaw.cloneAndSaveAsHistoryById(message._id, me);
		}

		const room = Rooms.findOneById(originalMessage.rid);
		if (!(await canAccessRoomAsync(room, { _id: userId }))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'pinMessage' });
		}

		originalMessage.pinned = true;
		originalMessage.pinnedAt = pinnedAt || new Date();
		originalMessage.pinnedBy = {
			_id: userId,
			username: me.username,
		};

		originalMessage = callbacks.run('beforeSaveMessage', originalMessage);

		await MessagesRaw.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
		if (isTheLastMessage(room, message)) {
			Rooms.setLastMessagePinned(room._id, originalMessage.pinnedBy, originalMessage.pinned);
		}

		const attachments: MessageAttachment[] = [];

		if (Array.isArray(originalMessage.attachments)) {
			originalMessage.attachments.forEach((attachment) => {
				if (!isQuoteAttachment(attachment) || shouldAdd(attachments, attachment)) {
					attachments.push(attachment);
				}
			});
		}

		// App IPostMessagePinned event hook
		await Apps.triggerEvent(AppEvents.IPostMessagePinned, originalMessage, Meteor.user(), originalMessage.pinned);

		return Messages.createWithTypeRoomIdMessageAndUser('message_pinned', originalMessage.rid, '', me, {
			attachments: [
				{
					text: originalMessage.msg,
					author_name: originalMessage.u.username,
					author_icon: getUserAvatarURL(originalMessage.u.username),
					ts: originalMessage.ts,
					attachments: attachments.map(recursiveRemove),
				},
			],
		});
	},
	async unpinMessage(message) {
		check(message._id, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unpinMessage',
			});
		}

		if (!settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
				method: 'unpinMessage',
				action: 'Message_pinning',
			});
		}

		let originalMessage = Messages.findOneById(message._id);
		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
				method: 'unpinMessage',
				action: 'Message_pinning',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, userId, { fields: { _id: 1 } });
		if (!subscription) {
			// If it's a valid message but on a room that the user is not subscribed to, report that the message was not found.
			throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
				method: 'unpinMessage',
				action: 'Message_pinning',
			});
		}

		if (!(await hasPermissionAsync(userId, 'pin-message', originalMessage.rid))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'unpinMessage' });
		}

		const me = Users.findOneById(userId);

		// If we keep history of edits, insert a new message to store history information
		if (settings.get('Message_KeepHistory')) {
			await MessagesRaw.cloneAndSaveAsHistoryById(originalMessage._id, me);
		}

		originalMessage.pinned = false;
		originalMessage.pinnedBy = {
			_id: userId,
			username: me.username,
		};
		originalMessage = callbacks.run('beforeSaveMessage', originalMessage);

		const room = Rooms.findOneById(originalMessage.rid, { fields: { ...roomAccessAttributes, lastMessage: 1 } });
		if (!(await canAccessRoomAsync(room, { _id: userId }))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'unpinMessage' });
		}

		if (isTheLastMessage(room, message)) {
			Rooms.setLastMessagePinned(room._id, originalMessage.pinnedBy, originalMessage.pinned);
		}

		// App IPostMessagePinned event hook
		await Apps.triggerEvent(AppEvents.IPostMessagePinned, originalMessage, Meteor.user(), originalMessage.pinned);

		await MessagesRaw.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);

		return true;
	},
});

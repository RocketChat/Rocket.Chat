import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../settings/server';
import { callbacks } from '../../../lib/callbacks';
import { isTheLastMessage } from '../../lib/server';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';
import { canAccessRoom, hasPermission, roomAccessAttributes } from '../../authorization/server';
import { Subscriptions, Messages, Users, Rooms } from '../../models';
import { Apps, AppEvents } from '../../apps/server/orchestrator';

const recursiveRemove = (msg, deep = 1) => {
	if (!msg) {
		return;
	}

	if (deep > settings.get('Message_QuoteChainLimit')) {
		delete msg.attachments;
		return msg;
	}

	msg.attachments = Array.isArray(msg.attachments) ? msg.attachments.map((nestedMsg) => recursiveRemove(nestedMsg, deep + 1)) : null;

	return msg;
};

const shouldAdd = (attachments, attachment) =>
	!attachments.some(({ message_link }) => message_link && message_link === attachment.message_link);

Meteor.methods({
	pinMessage(message, pinnedAt) {
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

		let originalMessage = Messages.findOneById(message._id);
		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			// If it's a valid message but on a room that the user is not subscribed to, report that the message was not found.
			throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		if (!hasPermission(Meteor.userId(), 'pin-message', originalMessage.rid)) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'pinMessage' });
		}

		const me = Users.findOneById(userId);

		// If we keep history of edits, insert a new message to store history information
		if (settings.get('Message_KeepHistory')) {
			Messages.cloneAndSaveAsHistoryById(message._id, me);
		}

		const room = Rooms.findOneById(originalMessage.rid);
		if (!canAccessRoom(room, { _id: Meteor.userId() })) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'pinMessage' });
		}

		originalMessage.pinned = true;
		originalMessage.pinnedAt = pinnedAt || Date.now;
		originalMessage.pinnedBy = {
			_id: userId,
			username: me.username,
		};

		originalMessage = callbacks.run('beforeSaveMessage', originalMessage);

		Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
		if (isTheLastMessage(room, message)) {
			Rooms.setLastMessagePinned(room._id, originalMessage.pinnedBy, originalMessage.pinned);
		}

		const attachments = [];

		if (Array.isArray(originalMessage.attachments)) {
			originalMessage.attachments.forEach((attachment) => {
				if (!attachment.message_link || shouldAdd(attachments, attachment)) {
					attachments.push(attachment);
				}
			});
		}

		// App IPostMessagePinned event hook
		Promise.await(Apps.triggerEvent(AppEvents.IPostMessagePinned, originalMessage, Meteor.user(), originalMessage.pinned));

		return Messages.createWithTypeRoomIdMessageAndUser('message_pinned', originalMessage.rid, '', me, {
			attachments: [
				{
					text: originalMessage.msg,
					author_name: originalMessage.u.username,
					author_icon: getUserAvatarURL(originalMessage.u.username),
					ts: originalMessage.ts,
					attachments: recursiveRemove(attachments),
				},
			],
		});
	},
	unpinMessage(message) {
		check(message._id, String);

		if (!Meteor.userId()) {
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

		const subscription = Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			// If it's a valid message but on a room that the user is not subscribed to, report that the message was not found.
			throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
				method: 'unpinMessage',
				action: 'Message_pinning',
			});
		}

		if (!hasPermission(Meteor.userId(), 'pin-message', originalMessage.rid)) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'unpinMessage' });
		}

		const me = Users.findOneById(Meteor.userId());

		// If we keep history of edits, insert a new message to store history information
		if (settings.get('Message_KeepHistory')) {
			Messages.cloneAndSaveAsHistoryById(originalMessage._id, me);
		}

		originalMessage.pinned = false;
		originalMessage.pinnedBy = {
			_id: Meteor.userId(),
			username: me.username,
		};
		originalMessage = callbacks.run('beforeSaveMessage', originalMessage);

		const room = Rooms.findOneById(originalMessage.rid, { fields: { ...roomAccessAttributes, lastMessage: 1 } });
		if (!canAccessRoom(room, { _id: Meteor.userId() })) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'unpinMessage' });
		}

		if (isTheLastMessage(room, message)) {
			Rooms.setLastMessagePinned(room._id, originalMessage.pinnedBy, originalMessage.pinned);
		}

		// App IPostMessagePinned event hook
		Promise.await(Apps.triggerEvent(AppEvents.IPostMessagePinned, originalMessage, Meteor.user(), originalMessage.pinned));

		return Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
	},
});

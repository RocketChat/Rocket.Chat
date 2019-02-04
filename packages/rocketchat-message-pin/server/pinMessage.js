import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { getAvatarUrlFromUsername } from 'meteor/rocketchat:utils';

const recursiveRemove = (msg, deep = 1) => {
	if (!msg) {
		return;
	}

	if (deep > RocketChat.settings.get('Message_QuoteChainLimit')) {
		delete msg.attachments;
		return msg;
	}

	msg.attachments = Array.isArray(msg.attachments) ? msg.attachments.map(
		(nestedMsg) => recursiveRemove(nestedMsg, deep + 1)
	) : null;

	return msg;
};

const shouldAdd = (attachments, attachment) => !attachments.some(({ message_link }) => message_link && message_link === attachment.message_link);

Meteor.methods({
	pinMessage(message, pinnedAt) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'pinMessage',
			});
		}

		if (!RocketChat.settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'pin-message', message.rid)) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'pinMessage' });
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}

		let originalMessage = RocketChat.models.Messages.findOneById(message._id);
		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		// If we keep history of edits, insert a new message to store history information
		if (RocketChat.settings.get('Message_KeepHistory')) {
			RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
		}
		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());
		const me = RocketChat.models.Users.findOneById(userId);

		originalMessage.pinned = true;
		originalMessage.pinnedAt = pinnedAt || Date.now;
		originalMessage.pinnedBy = {
			_id: userId,
			username: me.username,
		};

		originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);

		RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
		if (RocketChat.isTheLastMessage(room, message)) {
			RocketChat.models.Rooms.setLastMessagePinned(room._id, originalMessage.pinnedBy, originalMessage.pinned);
		}

		const attachments = [];

		if (Array.isArray(originalMessage.attachments)) {
			originalMessage.attachments.forEach((attachment) => {
				if (!attachment.message_link || shouldAdd(attachments, attachment)) {
					attachments.push(attachment);
				}
			});
		}

		return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser(
			'message_pinned',
			originalMessage.rid,
			'',
			me,
			{
				attachments: [
					{
						text: originalMessage.msg,
						author_name: originalMessage.u.username,
						author_icon: getAvatarUrlFromUsername(
							originalMessage.u.username
						),
						ts: originalMessage.ts,
						attachments: recursiveRemove(attachments),
					},
				],
			}
		);
	},
	unpinMessage(message) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unpinMessage',
			});
		}

		if (!RocketChat.settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
				method: 'unpinMessage',
				action: 'Message_pinning',
			});
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'pin-message', message.rid)) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'pinMessage' });
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}

		let originalMessage = RocketChat.models.Messages.findOneById(message._id);

		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
				method: 'unpinMessage',
				action: 'Message_pinning',
			});
		}

		// If we keep history of edits, insert a new message to store history information
		if (RocketChat.settings.get('Message_KeepHistory')) {
			RocketChat.models.Messages.cloneAndSaveAsHistoryById(originalMessage._id);
		}

		const me = RocketChat.models.Users.findOneById(Meteor.userId());
		originalMessage.pinned = false;
		originalMessage.pinnedBy = {
			_id: Meteor.userId(),
			username: me.username,
		};
		originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);
		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());
		if (RocketChat.isTheLastMessage(room, message)) {
			RocketChat.models.Rooms.setLastMessagePinned(room._id, originalMessage.pinnedBy, originalMessage.pinned);
		}

		return RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
	},
});

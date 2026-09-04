import { AppEvents, Apps } from '@rocket.chat/apps';
import { Message } from '@rocket.chat/core-services';
import type { IMessage, IUser, AtLeast } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { afterSaveMessage } from '../../hooks/messages/afterSaveMessage';
import { settings } from '../../settings';
import { validateCustomMessageFields } from '../messaging/validateCustomMessageFields';
import { notifyOnRoomChangedById } from '../notifyListener';

export const updateMessage = async function (
	{
		parseUrls,
		...message
	}: (AtLeast<IMessage, '_id' | 'rid' | 'msg' | 'customFields'> | AtLeast<IMessage, '_id' | 'rid' | 'content'>) & {
		parseUrls?: boolean;
	},
	user: IUser,
	originalMsg?: IMessage,
	previewUrls?: string[],
): Promise<void> {
	const originalMessage = originalMsg || (await Messages.findOneById(message._id));
	if (!originalMessage) {
		throw new Error('Invalid message ID.');
	}

	if (originalMessage.t === 'rm') {
		throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', {
			method: 'updateMessage',
			action: 'Message_editing',
		});
	}

	if (typeof message.msg === 'string') {
		message.msg = message.msg.replace(/\0/g, '');
	}
	if (Array.isArray(message.attachments)) {
		for (const attachment of message.attachments) {
			if (typeof attachment.description === 'string') {
				attachment.description = attachment.description.replace(/\0/g, '');
			}
		}
	}

	if (message.msg !== undefined && (typeof message.msg !== 'string' || !message.msg.trim()) && !originalMessage.attachments?.length && !originalMessage.blocks?.length) {
		throw new Meteor.Error('error-invalid-message', 'Message cannot be empty', {
			method: 'updateMessage',
		});
	}

	let messageData: IMessage = Object.assign({}, originalMessage, message);

	// For the Rocket.Chat Apps :)
	if (message && Apps.self && Apps.isLoaded()) {
		const prevent = await Apps.self?.triggerEvent(AppEvents.IPreMessageUpdatedPrevent, messageData);
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-updating', 'A Rocket.Chat App prevented the message updating.');
		}

		let result = await Apps.self?.triggerEvent(AppEvents.IPreMessageUpdatedExtend, messageData);
		result = await Apps.self?.triggerEvent(AppEvents.IPreMessageUpdatedModify, result);

		if (typeof result === 'object') {
			Object.assign(messageData, result);
		}
	}

	// If we keep history of edits, insert a new message to store history information
	if (settings.get('Message_KeepHistory')) {
		await Messages.cloneAndSaveAsHistoryById(messageData._id, user as Required<Pick<IUser, '_id' | 'username' | 'name'>>);
	}

	Object.assign(messageData, {
		editedAt: new Date(),
		editedBy: {
			_id: user._id,
			username: user.username,
		},
	});

	const room = await Rooms.findOneById(messageData.rid);
	if (!room) {
		return;
	}

	messageData = await Message.beforeSave({ message: messageData, room, user, previewUrls, parseUrls });

	if (typeof messageData.msg === 'string') {
		messageData.msg = messageData.msg.replace(/\0/g, '');
	}
	if (Array.isArray(messageData.attachments)) {
		for (const attachment of messageData.attachments) {
			if (typeof attachment.description === 'string') {
				attachment.description = attachment.description.replace(/\0/g, '');
			}
		}
	}

	if (messageData.msg !== undefined && (typeof messageData.msg !== 'string' || !messageData.msg.trim()) && !messageData.attachments?.length && !messageData.blocks?.length) {
		throw new Meteor.Error('error-invalid-message', 'Message cannot be empty', {
			method: 'updateMessage',
		});
	}

	if (messageData.customFields) {
		validateCustomMessageFields({
			customFields: messageData.customFields,
			messageCustomFieldsEnabled: settings.get<boolean>('Message_CustomFields_Enabled'),
			messageCustomFields: settings.get<string>('Message_CustomFields'),
		});
	}

	const { _id, ...editedMessage } = messageData;

	if (!editedMessage.msg) {
		delete editedMessage.md;
	}

	// do not send $unset if not defined. Can cause exceptions in certain mongo versions.
	const updateResult = await Messages.updateOne(
		{ _id, t: { $ne: 'rm' } },
		{
			$set: {
				...editedMessage,
			},
			...(!editedMessage.md && { $unset: { md: 1 } }),
		},
	);

	if (updateResult.matchedCount === 0) {
		throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', {
			method: 'updateMessage',
			action: 'Message_editing',
		});
	}

	if (Apps.self?.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		void Apps.self?.triggerEvent(AppEvents.IPostMessageUpdated, messageData);
	}

	setImmediate(async () => {
		const msg = await Messages.findOneById(_id);
		if (!msg) {
			return;
		}

		await afterSaveMessage(msg, room, user);

		if (room?.lastMessage?._id === msg._id) {
			void notifyOnRoomChangedById(message.rid);
		}
	});
};

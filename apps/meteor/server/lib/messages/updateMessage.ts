import { AppEvents, Apps } from '@rocket.chat/apps';
import { Message, ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IUser, AtLeast } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';

import { afterSaveMessage } from '../../hooks/messages/afterSaveMessage';
import { settings } from '../../settings';
import { validateCustomMessageFields } from '../messaging/validateCustomMessageFields';
import { notifyOnMessageChange, notifyOnRoomChangedById } from '../notifyListener';

/** Keeps the reply counters of both thread parents right when an update moves a message into, out of or between threads. */
async function updateThreadParents(message: IMessage, originalMessage: IMessage): Promise<void> {
	if (message.tmid === originalMessage.tmid) {
		return;
	}

	if (originalMessage.tmid) {
		await Messages.decreaseReplyCountById(originalMessage.tmid, -1);
		void notifyOnMessageChange({ id: originalMessage.tmid });
	}

	if (!message.tmid) {
		return;
	}

	const parentMessage = await Messages.findOneById(message.tmid, { projection: { u: 1, replies: 1 } });
	if (!parentMessage) {
		return;
	}

	const replies = parentMessage.replies?.length ? [message.u._id] : [parentMessage.u._id, message.u._id];
	await Messages.addReplyByThreadId(message.tmid, [...new Set(replies)], message.ts);
}

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

	let messageData: IMessage = Object.assign({}, originalMessage, message);

	// For the Rocket.Chat Apps :)
	if (message && Apps.self && Apps.isLoaded()) {
		const prevent = await Apps.self?.triggerEvent(AppEvents.IPreMessageUpdatedPrevent, messageData);
		if (prevent) {
			throw new ClientSafeError('error-app-prevented-updating', 'A Rocket.Chat App prevented the message updating.');
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
	await Messages.updateOne(
		{ _id },
		{
			$set: {
				...editedMessage,
			},
			...(!editedMessage.md && { $unset: { md: 1 } }),
		},
	);

	await updateThreadParents(messageData, originalMessage);

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

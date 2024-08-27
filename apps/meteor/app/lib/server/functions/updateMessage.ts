import { AppEvents, Apps } from '@rocket.chat/apps';
import { Message } from '@rocket.chat/core-services';
import type { IMessage, IUser, AtLeast } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { afterSaveMessage } from '../lib/afterSaveMessage';
import { notifyOnRoomChangedById, notifyOnMessageChange } from '../lib/notifyListener';
import { validateCustomMessageFields } from '../lib/validateCustomMessageFields';
import { parseUrlsInMessage } from './parseUrlsInMessage';

export const updateMessage = async function (
	message: AtLeast<IMessage, '_id' | 'rid' | 'msg' | 'customFields'>,
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
		const prevent = await Apps.getBridges().getListenerBridge().messageEvent(AppEvents.IPreMessageUpdatedPrevent, messageData);
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-updating', 'A Rocket.Chat App prevented the message updating.');
		}

		let result = await Apps.getBridges().getListenerBridge().messageEvent(AppEvents.IPreMessageUpdatedExtend, messageData);
		result = await Apps.getBridges().getListenerBridge().messageEvent(AppEvents.IPreMessageUpdatedModify, result);

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

	parseUrlsInMessage(messageData, previewUrls);

	const room = await Rooms.findOneById(messageData.rid);
	if (!room) {
		return;
	}

	messageData = await Message.beforeSave({ message: messageData, room, user });

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

	if (Apps.self?.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		void Apps.getBridges()?.getListenerBridge().messageEvent(AppEvents.IPostMessageUpdated, messageData);
	}

	setImmediate(async () => {
		const msg = await Messages.findOneById(_id);
		if (!msg) {
			return;
		}

		// although this is an "afterSave" kind callback, we know they can extend message's properties
		// so we wait for it to run before broadcasting
		const data = await afterSaveMessage(msg, room, user._id);

		void notifyOnMessageChange({
			id: msg._id,
			data,
		});

		if (room?.lastMessage?._id === msg._id) {
			void notifyOnRoomChangedById(message.rid);
		}
	});
};

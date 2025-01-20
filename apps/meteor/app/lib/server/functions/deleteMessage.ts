import { AppEvents, Apps } from '@rocket.chat/apps';
import { api, Message } from '@rocket.chat/core-services';
import { isThreadMessage, type AtLeast, type IMessage, type IRoom, type IThreadMessage, type IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Uploads, Users, ReadReceipts, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { canDeleteMessageAsync } from '../../../authorization/server/functions/canDeleteMessage';
import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import { notifyOnRoomChangedById, notifyOnMessageChange, notifyOnSubscriptionChangedByRoomIdAndUserIds } from '../lib/notifyListener';

export const deleteMessageValidatingPermission = async (message: AtLeast<IMessage, '_id'>, userId: IUser['_id']): Promise<void> => {
	if (!message?._id) {
		throw new Meteor.Error('error-invalid-message', 'Invalid message');
	}
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const user = await Users.findOneById(userId);
	const originalMessage = await Messages.findOneById(message._id);

	if (!originalMessage || !user || !(await canDeleteMessageAsync(userId, originalMessage))) {
		throw new Meteor.Error('error-action-not-allowed', 'Not allowed');
	}

	return deleteMessage(originalMessage, user);
};

export async function deleteMessage(message: IMessage, user: IUser): Promise<void> {
	const deletedMsg: IMessage | null = await Messages.findOneById(message._id);
	const isThread = (deletedMsg?.tcount || 0) > 0;
	const keepHistory = settings.get('Message_KeepHistory') || isThread;
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus') || isThread;
	const bridges = Apps.self?.isLoaded() && Apps.getBridges();

	const room = await Rooms.findOneById(message.rid, { projection: { lastMessage: 1, prid: 1, mid: 1, federated: 1 } });

	if (deletedMsg) {
		if (bridges) {
			const prevent = await bridges.getListenerBridge().messageEvent(AppEvents.IPreMessageDeletePrevent, deletedMsg);
			if (prevent) {
				throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the message deleting.');
			}
		}

		if (room) {
			await Message.beforeDelete(deletedMsg, room);
		}
	}

	if (deletedMsg && isThreadMessage(deletedMsg)) {
		await deleteThreadMessage(deletedMsg, user, room);
	}

	const files = (message.files || [message.file]).filter(Boolean); // Keep compatibility with old messages

	if (keepHistory) {
		if (showDeletedStatus) {
			// TODO is there a better way to tell TS "IUser[username]" is not undefined?
			await Messages.cloneAndSaveAsHistoryById(message._id, user as Required<Pick<IUser, '_id' | 'username' | 'name'>>);
		} else {
			await Messages.setHiddenById(message._id, true);
		}

		for await (const file of files) {
			file?._id && (await Uploads.updateOne({ _id: file._id }, { $set: { _hidden: true } }));
		}
	} else {
		if (!showDeletedStatus) {
			await Messages.removeById(message._id);
		}
		await ReadReceipts.removeByMessageId(message._id);

		for await (const file of files) {
			file?._id && (await FileUpload.getStore('Uploads').deleteById(file._id));
		}
	}
	if (showDeletedStatus) {
		// TODO is there a better way to tell TS "IUser[username]" is not undefined?
		await Messages.setAsDeletedByIdAndUser(message._id, user as Required<Pick<IUser, '_id' | 'username' | 'name'>>);
	} else {
		void api.broadcast('notify.deleteMessage', message.rid, { _id: message._id });
	}

	// update last message
	if (settings.get('Store_Last_Message') && (!room?.lastMessage || room.lastMessage._id === message._id)) {
		const lastMessageNotDeleted = await Messages.getLastVisibleUserMessageSentByRoomId(message.rid);
		await Rooms.resetLastMessageById(message.rid, lastMessageNotDeleted, -1);
	} else {
		// decrease message count
		await Rooms.decreaseMessageCountById(message.rid, 1);
	}

	await callbacks.run('afterDeleteMessage', deletedMsg, room);

	void notifyOnRoomChangedById(message.rid);

	if (keepHistory || showDeletedStatus) {
		void notifyOnMessageChange({
			id: message._id,
		});
	}

	if (bridges && deletedMsg) {
		void bridges.getListenerBridge().messageEvent(AppEvents.IPostMessageDeleted, deletedMsg, user);
	}
}

async function deleteThreadMessage(message: IThreadMessage, user: IUser, room: IRoom | null): Promise<void> {
	const updatedParentMessage = await Messages.decreaseReplyCountById(message.tmid, -1);

	if (room) {
		const { modifiedCount } = await Subscriptions.removeUnreadThreadsByRoomId(room._id, [message.tmid]);
		if (modifiedCount > 0) {
			// The replies array contains the ids of all the users that are following the thread (everyone that is involved + the ones who are following)
			// Technically, user._id is already in the message.replies array, but since we don't have any strong
			// guarantees of it, we are adding again to make sure it is there.
			const userIdsThatAreWatchingTheThread = [...new Set([user._id, ...(message.replies || [])])];
			// So they can decrement the unread threads count
			void notifyOnSubscriptionChangedByRoomIdAndUserIds(room._id, userIdsThatAreWatchingTheThread);
		}
	}

	if (updatedParentMessage && updatedParentMessage.tcount === 0) {
		void notifyOnMessageChange({
			id: message.tmid,
		});
	}
}

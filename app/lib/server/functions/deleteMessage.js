import { Meteor } from 'meteor/meteor';

import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import { Messages, Uploads, Rooms } from '../../../models/server';
import { Notifications } from '../../../notifications/server';
import { callbacks } from '../../../callbacks/server';
import { Apps } from '../../../apps/server';

export const deleteMessage = function(message, user) {
	const deletedMsg = Messages.findOneById(message._id);
	const isThread = deletedMsg.tcount > 0;
	const keepHistory = settings.get('Message_KeepHistory') || isThread;
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus') || isThread;

	if (deletedMsg && Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageDeletePrevent', deletedMsg));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the message deleting.');
		}
	}

	if (keepHistory) {
		if (showDeletedStatus) {
			Messages.cloneAndSaveAsHistoryById(message._id, user);
		} else {
			Messages.setHiddenById(message._id, true);
		}

		if (message.file && message.file._id) {
			Uploads.update(message.file._id, { $set: { _hidden: true } });
		}
	} else {
		if (!showDeletedStatus) {
			Messages.removeById(message._id);
		}

		if (message.file && message.file._id) {
			FileUpload.getStore('Uploads').deleteById(message.file._id);
		}
	}

	const room = Rooms.findOneById(message.rid, { fields: { lastMessage: 1, prid: 1, mid: 1 } });
	callbacks.run('afterDeleteMessage', deletedMsg, room, user);

	// update last message
	if (settings.get('Store_Last_Message')) {
		if (!room.lastMessage || room.lastMessage._id === message._id) {
			Rooms.resetLastMessageById(message.rid, message._id);
		}
	}

	// decrease message count
	Rooms.decreaseMessageCountById(message.rid, 1);

	if (showDeletedStatus) {
		Messages.setAsDeletedByIdAndUser(message._id, user);
	} else {
		Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });
	}

	if (Apps && Apps.isLoaded()) {
		Apps.getBridges().getListenerBridge().messageEvent('IPostMessageDeleted', deletedMsg);
	}
};

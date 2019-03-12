import { Meteor } from 'meteor/meteor';
import { FileUpload } from '/app/file-upload';
import { settings } from '/app/settings';
import { Messages, Uploads, Rooms } from '/app/models';
import { Notifications } from '/app/notifications';
import { callbacks } from '/app/callbacks';
import { Apps } from '/app/apps';

export const deleteMessage = function(message, user) {
	const keepHistory = settings.get('Message_KeepHistory');
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus');
	const deletedMsg = Messages.findOneById(message._id);

	if (deletedMsg && Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageDeletePrevent', deletedMsg));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the message deleting.');
		}
	}

	if (keepHistory) {
		if (showDeletedStatus) {
			Messages.cloneAndSaveAsHistoryById(message._id);
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
	Meteor.defer(function() {
		callbacks.run('afterDeleteMessage', deletedMsg);
	});

	// update last message
	if (settings.get('Store_Last_Message')) {
		if (!room.lastMessage || room.lastMessage._id === message._id) {
			Rooms.resetLastMessageById(message.rid, message._id);
		}
	}

	if (showDeletedStatus) {
		Messages.setAsDeletedByIdAndUser(message._id, user);
	} else {
		Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });
	}

	if (Apps && Apps.isLoaded()) {
		Apps.getBridges().getListenerBridge().messageEvent('IPostMessageDeleted', deletedMsg);
	}
};

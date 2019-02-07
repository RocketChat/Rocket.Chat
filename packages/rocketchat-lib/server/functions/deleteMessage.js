import { Meteor } from 'meteor/meteor';
import { FileUpload } from 'meteor/rocketchat:file-upload';

RocketChat.deleteMessage = function(message, user) {
	const keepHistory = RocketChat.settings.get('Message_KeepHistory');
	const showDeletedStatus = RocketChat.settings.get('Message_ShowDeletedStatus');
	const deletedMsg = RocketChat.models.Messages.findOneById(message._id);

	if (deletedMsg && Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageDeletePrevent', deletedMsg));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the message deleting.');
		}
	}

	if (keepHistory) {
		if (showDeletedStatus) {
			RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
		} else {
			RocketChat.models.Messages.setHiddenById(message._id, true);
		}

		if (message.file && message.file._id) {
			RocketChat.models.Uploads.update(message.file._id, { $set: { _hidden: true } });
		}
	} else {
		if (!showDeletedStatus) {
			RocketChat.models.Messages.removeById(message._id);
		}

		if (message.file && message.file._id) {
			FileUpload.getStore('Uploads').deleteById(message.file._id);
		}
	}

	Meteor.defer(function() {
		RocketChat.callbacks.run('afterDeleteMessage', deletedMsg);
	});

	// update last message
	if (RocketChat.settings.get('Store_Last_Message')) {
		const room = RocketChat.models.Rooms.findOneById(message.rid, { fields: { lastMessage: 1 } });
		if (!room.lastMessage || room.lastMessage._id === message._id) {
			RocketChat.models.Rooms.resetLastMessageById(message.rid, message._id);
		}
	}

	if (showDeletedStatus) {
		RocketChat.models.Messages.setAsDeletedByIdAndUser(message._id, user);
	} else {
		RocketChat.Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });
	}

	if (Apps && Apps.isLoaded()) {
		Apps.getBridges().getListenerBridge().messageEvent('IPostMessageDeleted', deletedMsg);
	}
};

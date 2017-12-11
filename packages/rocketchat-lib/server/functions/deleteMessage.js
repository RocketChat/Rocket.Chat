/* globals FileUpload */
RocketChat.deleteMessage = function(message, user) {
	const keepHistory = RocketChat.settings.get('Message_KeepHistory');
	const showDeletedStatus = RocketChat.settings.get('Message_ShowDeletedStatus');
	let deletedMsg;

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
			deletedMsg = RocketChat.models.Messages.findOneById(message._id);
			RocketChat.models.Messages.removeById(message._id);
		}

		if (message.file && message.file._id) {
			FileUpload.getStore('Uploads').deleteById(message.file._id);
		}

		Meteor.defer(function() {
			RocketChat.callbacks.run('afterDeleteMessage', deletedMsg);
		});
	}

	if (showDeletedStatus) {
		RocketChat.models.Messages.setAsDeletedByIdAndUser(message._id, user);
	} else {
		RocketChat.Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });
	}
};

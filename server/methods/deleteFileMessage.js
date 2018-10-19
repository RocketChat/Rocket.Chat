/* global FileUpload */
import { Meteor } from 'meteor/meteor';

Meteor.methods({
	deleteFileMessage(fileID) {
		check(fileID, String);

		const msg = RocketChat.models.Messages.getMessageByFileId(fileID);

		if (msg) {
			return Meteor.call('deleteMessage', msg);
		}

		return FileUpload.getStore('Uploads').deleteById(fileID);
	},
});

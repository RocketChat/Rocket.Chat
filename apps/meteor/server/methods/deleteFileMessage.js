import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { FileUpload } from '../../app/file-upload';
import { Messages } from '../../app/models';

Meteor.methods({
	async deleteFileMessage(fileID) {
		check(fileID, String);

		const msg = Messages.getMessageByFileId(fileID);

		if (msg) {
			return Meteor.call('deleteMessage', msg);
		}

		return FileUpload.getStore('Uploads').deleteById(fileID);
	},
});

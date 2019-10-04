import { Meteor } from 'meteor/meteor';

import { FileUpload } from '../../../file-upload/server';
import { Uploads } from '../../../models/server';

export const normalizeMessageFileUpload = (message) => {
	if (message.file && !message.fileUpload) {
		const jwt = FileUpload.generateJWTToFileUrls({ rid: message.rid, userId: message.u._id, fileId: message.file._id });
		const file = Uploads.findOne({ _id: message.file._id });
		if (!file) {
			return message;
		}
		message.fileUpload = {
			publicFilePath: Meteor.absoluteUrl(`${ FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`).substring(1) }${ jwt ? `?token=${ jwt }` : '' }`),
			type: file.type,
			size: file.size,
		};
	}
	return message;
};

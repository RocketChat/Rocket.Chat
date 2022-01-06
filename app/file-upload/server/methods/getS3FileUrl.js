import { Meteor } from 'meteor/meteor';
import { UploadFS } from 'meteor/jalik:ufs';

import { settings } from '../../../settings/server';
import { Uploads } from '../../../models/server/raw';

let protectedFiles;

settings.watch('FileUpload_ProtectFiles', function (value) {
	protectedFiles = value;
});

Meteor.methods({
	async getS3FileUrl(fileId) {
		if (protectedFiles && !Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendFileMessage' });
		}
		const file = await Uploads.findOneById(fileId);

		return UploadFS.getStore('AmazonS3:Uploads').getRedirectURL(file);
	},
});

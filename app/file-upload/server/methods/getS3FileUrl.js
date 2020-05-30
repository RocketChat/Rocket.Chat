import { Meteor } from 'meteor/meteor';
import { UploadFS } from 'meteor/jalik:ufs';

import { settings } from '../../../settings';
import { Uploads } from '../../../models';

let protectedFiles;

settings.get('FileUpload_ProtectFiles', function(key, value) {
	protectedFiles = value;
});

Meteor.methods({
	getS3FileUrl(fileId) {
		if (protectedFiles && !Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendFileMessage' });
		}
		const file = Uploads.findOneById(fileId);

		return UploadFS.getStore('AmazonS3:Uploads').getRedirectURL(file);
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { UploadFS } from 'meteor/jalik:ufs';
import { Uploads } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { canAccessRoom } from '../../../authorization/server';

let protectedFiles;

settings.watch('FileUpload_ProtectFiles', function (value) {
	protectedFiles = value;
});

Meteor.methods({
	async getS3FileUrl(fileId) {
		check(fileId, String);
		if (protectedFiles && !Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendFileMessage' });
		}
		const file = await Uploads.findOneById(fileId);
		if (!file.rid || !canAccessRoom({ _id: file.rid }, { _id: this.userId })) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		return UploadFS.getStore('AmazonS3:Uploads').getRedirectURL(file);
	},
});

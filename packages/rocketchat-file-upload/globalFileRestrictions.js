/* globals Slingshot */

import filesize from 'filesize';

const slingShotConfig = {
	authorize(file/*, metaContext*/) {
		//Deny uploads if user is not logged in.
		if (!this.userId) {
			throw new Meteor.Error('login-required', 'Please login before posting files');
		}

		if (!RocketChat.fileUploadIsValidContentType(file.type)) {
			throw new Meteor.Error(TAPi18n.__('error-invalid-file-type'));
		}

		const maxFileSize = RocketChat.settings.get('FileUpload_MaxFileSize');

		if (maxFileSize >= -1 && maxFileSize < file.size) {
			throw new Meteor.Error(TAPi18n.__('File_exceeds_allowed_size_of_bytes', { size: filesize(maxFileSize) }));
		}

		return true;
	},
	maxSize: 0,
	allowedFileTypes: null
};

Slingshot.fileRestrictions('rocketchat-uploads', slingShotConfig);
Slingshot.fileRestrictions('rocketchat-uploads-gs', slingShotConfig);

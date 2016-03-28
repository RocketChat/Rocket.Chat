/* globals Slingshot */

Slingshot.fileRestrictions('rocketchat-uploads', {
	authorize: function(file/*, metaContext*/) {
		if (!RocketChat.fileUploadIsValidContentType(file.type)) {
			throw new Meteor.Error(TAPi18n.__('Invalid_file_type'));
		}

		var maxFileSize = RocketChat.settings.get('FileUpload_MaxFileSize');

		if (maxFileSize && maxFileSize < file.size) {
			throw new Meteor.Error(TAPi18n.__('File_exceeds_allowed_size_of_bytes', { size: maxFileSize }));
		}

		//Deny uploads if user is not logged in.
		if (!this.userId) {
			throw new Meteor.Error('login-require', 'Please login before posting files');
		}

		return true;
	},
	maxSize: 0,
	allowedFileTypes: null
});

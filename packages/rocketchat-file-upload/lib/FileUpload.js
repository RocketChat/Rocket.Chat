/* globals FileUpload:true */
/* exported FileUpload */

var maxFileSize = 0;

FileUpload = {
	validateFileUpload(file) {
		if (file.size > maxFileSize) {
			throw new Meteor.Error('error-file-too-large', 'File is too large');
		}

		if (!RocketChat.fileUploadIsValidContentType(file.type)) {
			throw new Meteor.Error('error-invalid-file-type', 'File type is not accepted');
		}

		return true;
	}
};

RocketChat.settings.get('FileUpload_MaxFileSize', function(key, value) {
	maxFileSize = value;
});

import filesize from 'filesize';

Meteor.methods({
	'livechat:validateFileUpload'(type, size) {
		check(type, String);
		check(size, Number);

		if (!RocketChat.fileUploadIsValidContentType(type)) {
			return {
				result: false,
				reason: 'typeNotAllowed'
			};
		}

		const maxFileSize = RocketChat.settings.get('FileUpload_MaxFileSize', function(key, value) {
			try {
				return parseInt(value);
			} catch (e) {
				return RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').packageValue;
			}
		});

		// -1 maxFileSize means there is no limit
		if (maxFileSize >= -1 && size > maxFileSize) {
			return {
				result: false,
				reason: 'sizeNotAllowed',
				sizeAllowed: filesize(maxFileSize)
			};
		}

		return {
			result: true
		};
	}
});

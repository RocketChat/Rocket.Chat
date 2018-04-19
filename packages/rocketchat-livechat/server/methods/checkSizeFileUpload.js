import filesize from 'filesize';

Meteor.methods({
	'livechat:checkSizeFileUpload'(size) {
		check(size, Number);

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
				sizeAllowed: filesize(maxFileSize)
			};
		}

		return {
			result: true
		};
	}
});

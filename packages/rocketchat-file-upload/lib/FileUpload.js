/* globals FileUpload:true */
/* exported FileUpload */

import filesize from 'filesize';

let maxFileSize = 0;

FileUpload = {
	validateFileUpload(file) {
		if (!Match.test(file.rid, String)) {
			return false;
		}
		// livechat users can upload files but they don't have an userId
		const user = file.userId ? Meteor.user() : null;
		const room = RocketChat.models.Rooms.findOneById(file.rid);
		const directMessageAllow = RocketChat.settings.get('FileUpload_Enabled_Direct');
		const fileUploadAllowed = RocketChat.settings.get('FileUpload_Enabled');
		if (RocketChat.authz.canAccessRoom(room, user, file) !== true) {
			return false;
		}
		const language = user ? user.language : 'en';
		if (!fileUploadAllowed) {
			const reason = TAPi18n.__('FileUpload_Disabled', language);
			throw new Meteor.Error('error-file-upload-disabled', reason);
		}

		if (!directMessageAllow && room.t === 'd') {
			const reason = TAPi18n.__('File_not_allowed_direct_messages', language);
			throw new Meteor.Error('error-direct-message-file-upload-not-allowed', reason);
		}

		// -1 maxFileSize means there is no limit
		if (maxFileSize > -1 && file.size > maxFileSize) {
			const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
				size: filesize(maxFileSize),
			}, language);
			throw new Meteor.Error('error-file-too-large', reason);
		}

		if (!RocketChat.fileUploadIsValidContentType(file.type)) {
			const reason = TAPi18n.__('File_type_is_not_accepted', language);
			throw new Meteor.Error('error-invalid-file-type', reason);
		}

		return true;
	},
};

RocketChat.settings.get('FileUpload_MaxFileSize', function(key, value) {
	try {
		maxFileSize = parseInt(value);
	} catch (e) {
		maxFileSize = RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').packageValue;
	}
});

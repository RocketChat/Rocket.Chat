Meteor.methods({
	'livechat:checkTypeFileUpload'(type) {
		check(type, String);

		return RocketChat.fileUploadIsValidContentType(type);
	}
});

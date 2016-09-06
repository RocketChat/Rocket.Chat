Meteor.methods({
	deleteFileMessage: function(fileID) {
		check(fileID, String);

		return Meteor.call('deleteMessage', RocketChat.models.Messages.getMessageByFileId(fileID));
	}
});

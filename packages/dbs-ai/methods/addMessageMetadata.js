Meteor.methods({
	'addMessageMetadata'(message, metadata) { //(message, metadata){
		console.log('Adding metadata to message', message._id);
		return RocketChat.models.Messages.addMetadata(message, metadata);
	}
});

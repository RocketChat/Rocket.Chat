Meteor.publish('clientCommands', function() {
	if (!this.userId) {
		return this.ready();
	}

	return RocketChat.models.ClientCommand.findById(this.userId);
});

Meteor.publish('clientCommands', function() {
	if (!this.userId) {
		return this.ready();
	}

	return RocketChat.models.ClientCommands.findById(this.userId);
});

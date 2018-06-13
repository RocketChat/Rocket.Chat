Meteor.publish('clientCommands', function() {
	if (!this.userId) {
		return this.ready();
	}

	this.onStop(() => {
		RocketChat.resetCustomClientData(this.userId);
	});

	return RocketChat.models.ClientCommands.findById(this.userId);
});

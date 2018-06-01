Meteor.publish('clientCommands', function() {
	if (!this.userId) {
		return this.ready();
	}

	RocketChat.models.Users.update({_id: this.userId, type: 'bot'}, {
		$set: {
			'botData.paused': false
		}
	});

	return RocketChat.models.ClientCommands.findById(this.userId);
});

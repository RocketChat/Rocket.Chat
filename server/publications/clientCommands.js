Meteor.publish('clientCommands', function() {
	if (!this.userId) {
		return this.ready();
	}

	const update = RocketChat.models.Users.update({_id: this.userId, type: 'bot'}, {
		$set: {
			'botData.paused': false
		}
	});
	if (update > 0) {
		Meteor.call('UserPresence:setDefaultStatus', this.userId, 'online');
	}

	return RocketChat.models.ClientCommands.findById(this.userId);
});

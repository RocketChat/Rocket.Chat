Meteor.publish('roles', function() {
	if (!this.userId) {
		return this.ready();
	}

	return RocketChat.models.Roles.find();
});

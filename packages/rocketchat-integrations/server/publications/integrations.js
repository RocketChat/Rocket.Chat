Meteor.publish('integrations', function _integrationPublication() {
	if (!this.userId) {
		return this.ready();
	}

	if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
		return RocketChat.models.Integrations.find();
	} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
		return RocketChat.models.Integrations.find({ '_createdBy._id': this.userId });
	} else {
		throw new Meteor.Error('not-authorized');
	}
});

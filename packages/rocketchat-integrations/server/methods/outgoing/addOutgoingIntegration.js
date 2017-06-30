Meteor.methods({
	addOutgoingIntegration(integration) {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')
			&& !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')
			&& !RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')
			&& !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
			throw new Meteor.Error('not_authorized');
		}

		integration = RocketChat.integrations.validateOutgoing(integration, this.userId);

		integration._createdAt = new Date();
		integration._createdBy = RocketChat.models.Users.findOne(this.userId, {fields: {username: 1}});
		integration._id = RocketChat.models.Integrations.insert(integration);

		return integration;
	}
});

Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId) {
	if (!this.userId) {
		return this.ready();
	}

	if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
		return RocketChat.models.IntegrationHistory.findByIntegrationId(integrationId, { sort: { _updatedAt: -1 }});
	} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
		return RocketChat.models.Integrations.findByIntegrationIdAndCreatedBy(integrationId, this.userId);
	} else {
		throw new Meteor.Error('not-authorized');
	}
});

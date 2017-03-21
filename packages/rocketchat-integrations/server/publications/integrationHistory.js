Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId, limit = 25) {
	if (!this.userId) {
		return this.ready();
	}

	if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
		return RocketChat.models.IntegrationHistory.findByIntegrationId(integrationId, { sort: { _updatedAt: -1 }, limit });
	} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
		return RocketChat.models.IntegrationHistory.findByIntegrationIdAndCreatedBy(integrationId, this.userId, { sort: { _updatedAt: -1 }, limit });
	} else {
		throw new Meteor.Error('not-authorized');
	}
});

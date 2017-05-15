Meteor.methods({
	updateOutgoingIntegration(integrationId, integration) {
		integration = RocketChat.integrations.validateOutgoing(integration, this.userId);

		if (!integration.token || integration.token.trim() === '') {
			throw new Meteor.Error('error-invalid-token', 'Invalid token', { method: 'updateOutgoingIntegration' });
		}

		let currentIntegration;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			currentIntegration = RocketChat.models.Integrations.findOne(integrationId);
		} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
			currentIntegration = RocketChat.models.Integrations.findOne({ _id: integrationId, '_createdBy._id': this.userId });
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'updateOutgoingIntegration' });
		}

		if (!currentIntegration) {
			throw new Meteor.Error('invalid_integration', '[methods] updateOutgoingIntegration -> integration not found');
		}

		RocketChat.models.Integrations.update(integrationId, {
			$set: {
				event: integration.event,
				enabled: integration.enabled,
				name: integration.name,
				avatar: integration.avatar,
				emoji: integration.emoji,
				alias: integration.alias,
				channel: integration.channel,
				targetRoom: integration.targetRoom,
				impersonateUser: integration.impersonateUser,
				username: integration.username,
				userId: integration.userId,
				urls: integration.urls,
				token: integration.token,
				script: integration.script,
				scriptEnabled: integration.scriptEnabled,
				scriptCompiled: integration.scriptCompiled,
				scriptError: integration.scriptError,
				triggerWords: integration.triggerWords,
				retryFailedCalls: integration.retryFailedCalls,
				retryCount: integration.retryCount,
				retryDelay: integration.retryDelay,
				triggerWordAnywhere: integration.triggerWordAnywhere,
				_updatedAt: new Date(),
				_updatedBy: RocketChat.models.Users.findOne(this.userId, {fields: {username: 1}})
			}
		});

		return RocketChat.models.Integrations.findOne(integrationId);
	}
});

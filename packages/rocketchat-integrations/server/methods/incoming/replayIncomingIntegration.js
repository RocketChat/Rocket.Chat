Meteor.methods({
	replayIncomingIntegration({ integrationId, historyId }) {
		console.log('aqui-1');
		let integration;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
			integration = RocketChat.models.Integrations.findOne(integrationId);
		} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
			integration = RocketChat.models.Integrations.findOne(integrationId, { fields: { '_createdBy._id': this.userId }});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'replayIncomingIntegration' });
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'replayIncomingIntegration' });
		}

		const history = RocketChat.models.IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

		if (!history) {
			throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', { method: 'replayIncomingIntegration' });
		}

		const url = Meteor.absoluteUrl(history.url);
		const opts = {
			params: {},
			method: 'POST',
			url,
			data: history.data,
			auth: undefined,
			headers: {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
			}
		};

		HTTP.call('POST', url, opts, (error, result) => {});
		return true;
	}
});

RocketChat.Migrations.add({
	version: 85,
	up() {
		const outgoingIntegrations = RocketChat.models.Integrations.find({ type: 'webhook-outgoing' }, { fields: { name: 1 }}).fetch();

		outgoingIntegrations.forEach((i) => {
			RocketChat.models.Integrations.update(i._id, { $set: { event: 'sendMessage', retryFailedCalls: true, retryCount: 6 }});
		});
	},
	down() {
		const outgoingIntegrations = RocketChat.models.Integrations.find({ type: 'webhook-outgoing', event: { $ne: 'sendMessage' }}, { fields: { name: 1 }}).fetch();

		outgoingIntegrations.forEach((i) => {
			RocketChat.models.Integrations.update(i._id, { $set: { enabled: false }});
		});
	}
});

RocketChat.Migrations.add({
	version: 89,
	up() {
		const outgoingIntegrations = RocketChat.models.Integrations.find({ type: 'webhook-outgoing' }, { fields: { name: 1 }}).fetch();

		outgoingIntegrations.forEach((i) => {
			RocketChat.models.Integrations.update(i._id, { $set: { event: 'sendMessage', retryFailedCalls: true, retryCount: 6, retryDelay: 'powers-of-ten' }});
		});
	},
	down() {
		const outgoingIntegrations = RocketChat.models.Integrations.find({ type: 'webhook-outgoing', event: { $ne: 'sendMessage' }}, { fields: { name: 1 }}).fetch();

		outgoingIntegrations.forEach((i) => {
			RocketChat.models.Integrations.update(i._id, { $set: { enabled: false }});
		});
	}
});

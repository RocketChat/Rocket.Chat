RocketChat.Migrations.add({
	version: 92,
	up() {
		const outgoingIntegrations = RocketChat.models.Integrations.find({ type: 'webhook-outgoing', 'event': 'sendMessage' }, { fields: { name: 1 }}).fetch();

		outgoingIntegrations.forEach((i) => {
			RocketChat.models.Integrations.update(i._id, { $set: { runOnEdits: true }});
		});
	}
});

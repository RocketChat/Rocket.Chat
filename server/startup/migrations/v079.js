RocketChat.Migrations.add({
	version: 79,
	up() {
		const integrations = RocketChat.models.Integrations.find({type: 'webhook-incoming'}).fetch();

		for (const integration of integrations) {
			if (typeof integration.channel === 'string') {
				RocketChat.models.Integrations.update({_id: integration._id}, {
					$set: {
						channel: integration.channel.split(',').map(channel => channel.trim())
					}
				});
			}
		}
	}
});

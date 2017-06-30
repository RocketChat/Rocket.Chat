RocketChat.Migrations.add({
	version: 80,
	up() {
		const query = {
			type: 'webhook-outgoing',
			$or: [{
				channel: []
			}, {
				channel: ''
			}, {
				channel: {
					$exists: false
				}
			}]
		};

		const update = {
			$set: {
				channel: ['all_public_channels']
			}
		};

		RocketChat.models.Integrations.update(query, update, {multi: true});
	}
});

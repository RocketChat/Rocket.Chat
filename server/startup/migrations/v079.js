import { Migrations } from '../../../app/migrations';
import { Integrations } from '../../../app/models';

Migrations.add({
	version: 79,
	up() {
		const integrations = Integrations.find({ type: 'webhook-incoming' }).fetch();

		for (const integration of integrations) {
			if (typeof integration.channel === 'string') {
				Integrations.update({ _id: integration._id }, {
					$set: {
						channel: integration.channel.split(',').map((channel) => channel.trim()),
					},
				});
			}
		}
	},
});

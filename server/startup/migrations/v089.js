import { Migrations } from '../../../app/migrations';
import { Integrations } from '../../../app/models';

Migrations.add({
	version: 89,
	up() {
		const outgoingIntegrations = Integrations.find({ type: 'webhook-outgoing' }, { fields: { name: 1 } }).fetch();

		outgoingIntegrations.forEach((i) => {
			Integrations.update(i._id, { $set: { event: 'sendMessage', retryFailedCalls: true, retryCount: 6, retryDelay: 'powers-of-ten' } });
		});
	},
	down() {
		const outgoingIntegrations = Integrations.find({ type: 'webhook-outgoing', event: { $ne: 'sendMessage' } }, { fields: { name: 1 } }).fetch();

		outgoingIntegrations.forEach((i) => {
			Integrations.update(i._id, { $set: { enabled: false } });
		});
	},
});

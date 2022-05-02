import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { IntegrationHistory, Integrations } from '../../../models/server/raw';
import notifications from '../../../notifications/server/lib/Notifications';

Meteor.methods({
	async clearIntegrationHistory(integrationId) {
		let integration;

		if (!this.userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'clearIntegrationHistory',
			});
		}

		if (hasPermission(this.userId, 'manage-outgoing-integrations')) {
			integration = await Integrations.findOneById(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-outgoing-integrations')) {
			integration = await Integrations.findOne({
				'_id': integrationId,
				'_createdBy._id': this.userId,
			});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'clearIntegrationHistory',
			});
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
				method: 'clearIntegrationHistory',
			});
		}

		await IntegrationHistory.removeByIntegrationId(integrationId);

		notifications.streamIntegrationHistory.emit(integrationId, { type: 'removed' });

		return true;
	},
});

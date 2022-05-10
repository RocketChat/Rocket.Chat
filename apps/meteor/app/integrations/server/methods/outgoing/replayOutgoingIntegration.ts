import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';
import { Integrations, IntegrationHistory } from '../../../../models/server/raw';
import { triggerHandler } from '../../lib/triggerHandler';

Meteor.methods({
	async replayOutgoingIntegration({ integrationId, historyId }) {
		let integration;

		if (!this.userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'replayOutgoingIntegration',
			});
		}

		if (hasPermission(this.userId, 'manage-outgoing-integrations')) {
			integration = await Integrations.findOneById(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-outgoing-integrations')) {
			integration = await Integrations.findOne({
				'_id': integrationId,
				'_createdBy._id': this.userId,
			});
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
				method: 'replayOutgoingIntegration',
			});
		}

		const history = await IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

		if (!history) {
			throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', {
				method: 'replayOutgoingIntegration',
			});
		}

		triggerHandler.replay(integration, history);

		return true;
	},
});

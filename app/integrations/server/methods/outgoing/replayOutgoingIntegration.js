import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization';
import { Integrations, IntegrationHistory } from '../../../../models';
import { triggerHandler } from '../../lib/triggerHandler';

Meteor.methods({
	replayOutgoingIntegration({ integrationId, historyId }) {
		let integration;

		if (hasPermission(this.userId, 'manage-outgoing-integrations') || hasPermission(this.userId, 'manage-outgoing-integrations', 'bot')) {
			integration = Integrations.findOne(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-outgoing-integrations') || hasPermission(this.userId, 'manage-own-outgoing-integrations', 'bot')) {
			integration = Integrations.findOne(integrationId, { fields: { '_createdBy._id': this.userId } });
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'replayOutgoingIntegration' });
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'replayOutgoingIntegration' });
		}

		const history = IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

		if (!history) {
			throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', { method: 'replayOutgoingIntegration' });
		}

		triggerHandler.replay(integration, history);

		return true;
	},
});

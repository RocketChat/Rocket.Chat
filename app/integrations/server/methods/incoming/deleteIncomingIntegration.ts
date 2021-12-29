import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';
import { Integrations } from '../../../../models/server/raw';

Meteor.methods({
	async deleteIncomingIntegration(integrationId) {
		let integration;

		if (hasPermission(this.userId, 'manage-incoming-integrations')) {
			integration = Integrations.findOneById(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-incoming-integrations')) {
			integration = Integrations.findOne({
				'_id': integrationId,
				'_createdBy._id': this.userId,
			});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'deleteIncomingIntegration',
			});
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
				method: 'deleteIncomingIntegration',
			});
		}

		await Integrations.removeById(integrationId);

		return true;
	},
});

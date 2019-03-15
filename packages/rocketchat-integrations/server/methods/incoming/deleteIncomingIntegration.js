import { Meteor } from 'meteor/meteor';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Integrations } from 'meteor/rocketchat:models';

Meteor.methods({
	deleteIncomingIntegration(integrationId) {
		let integration;

		if (hasPermission(this.userId, 'manage-integrations')) {
			integration = Integrations.findOne(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-integrations')) {
			integration = Integrations.findOne(integrationId, { fields : { '_createdBy._id': this.userId } });
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'deleteIncomingIntegration' });
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'deleteIncomingIntegration' });
		}

		Integrations.remove({ _id: integrationId });

		return true;
	},
});

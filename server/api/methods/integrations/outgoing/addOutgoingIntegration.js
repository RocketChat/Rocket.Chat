import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { Users, Integrations } from '../../../../models';
import { integrations } from '../../../../integrations/custom/rocketchat';

Meteor.methods({
	addOutgoingIntegration(integration) {
		if (!hasPermission(this.userId, 'manage-outgoing-integrations')
			&& !hasPermission(this.userId, 'manage-own-outgoing-integrations')
			&& !hasPermission(this.userId, 'manage-outgoing-integrations', 'bot')
			&& !hasPermission(this.userId, 'manage-own-outgoing-integrations', 'bot')) {
			throw new Meteor.Error('not_authorized');
		}

		integration = integrations.validateOutgoing(integration, this.userId);

		integration._createdAt = new Date();
		integration._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });
		integration._id = Integrations.insert(integration);

		return integration;
	},
});

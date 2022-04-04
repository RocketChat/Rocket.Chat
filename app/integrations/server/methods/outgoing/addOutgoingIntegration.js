import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';
import { Users } from '../../../../models/server';
import { Integrations } from '../../../../models/server/raw';
import { integrations } from '../../../lib/rocketchat';

Meteor.methods({
	async addOutgoingIntegration(integration) {
		if (!hasPermission(this.userId, 'manage-outgoing-integrations') && !hasPermission(this.userId, 'manage-own-outgoing-integrations')) {
			throw new Meteor.Error('not_authorized');
		}

		integration = integrations.validateOutgoing(integration, this.userId);

		integration._createdAt = new Date();
		integration._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });

		const result = await Integrations.insertOne(integration);
		integration._id = result.insertedId;

		return integration;
	},
});

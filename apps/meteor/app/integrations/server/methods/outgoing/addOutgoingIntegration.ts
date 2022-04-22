import { Meteor } from 'meteor/meteor';
import type { INewOutgoingIntegration, IOutgoingIntegration } from '@rocket.chat/core-typings';

import { hasPermission } from '../../../../authorization/server';
import { Users } from '../../../../models/server';
import { Integrations } from '../../../../models/server/raw';
import { validateOutgoingIntegration } from '../../lib/validateOutgoingIntegration';

Meteor.methods({
	async addOutgoingIntegration(integration: INewOutgoingIntegration): Promise<IOutgoingIntegration> {
		const { userId } = this;

		if (!userId || (!hasPermission(userId, 'manage-outgoing-integrations') && !hasPermission(userId, 'manage-own-outgoing-integrations'))) {
			throw new Meteor.Error('not_authorized');
		}

		const integrationData = validateOutgoingIntegration(integration, userId);

		integrationData._createdAt = new Date();
		integrationData._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });

		const result = await Integrations.insertOne(integrationData);
		integrationData._id = result.insertedId;

		return integrationData;
	},
});

import { Meteor } from 'meteor/meteor';
import { FederationRoomEvents } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

Meteor.methods({
	'federation:loadContextEvents': async (latestEventTimestamp) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'loadContextEvents' });
		}

		if (!(await hasPermissionAsync(Meteor.userId(), 'view-federation-data'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'loadContextEvents',
			});
		}

		return FederationRoomEvents.find({ timestamp: { $gt: new Date(latestEventTimestamp) } }, { sort: { timestamp: 1 } }).fetch();
	},
});

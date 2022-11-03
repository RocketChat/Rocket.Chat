import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { FederationRoomEvents } from '../../../models/server';

Meteor.methods({
	'federation:loadContextEvents': (latestEventTimestamp) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'loadContextEvents' });
		}

		if (!hasPermission(Meteor.userId(), 'view-federation-data')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'loadContextEvents',
			});
		}

		return FederationRoomEvents.find({ timestamp: { $gt: new Date(latestEventTimestamp) } }, { sort: { timestamp: 1 } }).fetch();
	},
});

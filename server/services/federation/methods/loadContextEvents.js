import { Meteor } from 'meteor/meteor';

import { hasRole } from '../../../../app/authorization/server';
import { FederationRoomEvents } from '../../../models';

Meteor.methods({
	'federation:loadContextEvents': (latestEventTimestamp) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'loadContextEvents' });
		}

		if (!hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'loadContextEvents' });
		}

		return FederationRoomEvents.find({ timestamp: { $gt: new Date(latestEventTimestamp) } }, { sort: { timestamp: 1 } }).fetch();
	},
});

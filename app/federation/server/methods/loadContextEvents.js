import { Meteor } from 'meteor/meteor';

import { FederationRoomEvents } from '../../../models';

export function loadContextEvents(latestEventTimestamp) {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'loadContextEvents' });
	}

	return FederationRoomEvents.find({ timestamp: { $gt: new Date(latestEventTimestamp) } }, { sort: { timestamp: 1 } }).fetch();
}

Meteor.methods({
	'federation:loadContextEvents': loadContextEvents,
});

import { Meteor } from 'meteor/meteor';
import { UserPresence } from 'meteor/konecty:user-presence';

import { InstanceStatus, UsersSessions } from '../../app/models/server/raw';
import { isPresenceMonitorEnabled } from '../lib/isPresenceMonitorEnabled';

Meteor.startup(function () {
	UserPresence.start();

	if (!isPresenceMonitorEnabled()) {
		return;
	}
	// UserPresenceMonitor.start();

	// Remove lost connections
	const ids = Promise.await(InstanceStatus.find({}, { projection: { _id: 1 } }).toArray()).map((id) => id._id);

	Promise.await(UsersSessions.clearConnectionsFromInstanceId(ids));
});

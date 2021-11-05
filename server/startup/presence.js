import { Meteor } from 'meteor/meteor';
import { UserPresence } from 'meteor/konecty:user-presence';

import InstanceStatusModel from '../../app/models/server/models/InstanceStatus';
import { UsersSessions } from '../../app/models/server/raw';
import { isPresenceMonitorEnabled } from '../lib/isPresenceMonitorEnabled';

Meteor.startup(function() {
	UserPresence.start();

	if (!isPresenceMonitorEnabled()) {
		return;
	}
	// UserPresenceMonitor.start();

	// Remove lost connections
	const ids = InstanceStatusModel.find({}, { fields: { _id: 1 } }).fetch().map((id) => id._id);

	Promise.await(UsersSessions.clearConnectionsFromInstanceId(ids));
});

import { UserPresenceEvents } from 'meteor/konecty:user-presence';

import { Notifications } from '../../../app/notifications/server';

UserPresenceEvents.on('setUserStatus', (user, status/* , statusConnection*/) => {
	const {
		_id,
		username,
		// name,
		// utcOffset,
	} = user;

	// since this callback can be called by only one instance in the cluster
	// we need to brodcast the change to all instances
	Notifications.notifyLogged('user-status', {
		_id,
		username,
		status,
	});
});

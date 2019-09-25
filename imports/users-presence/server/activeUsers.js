import { UserPresenceEvents } from 'meteor/konecty:user-presence';

import { Notifications } from '../../../app/notifications/server';

// mirror of object in /imports/startup/client/listenActiveUsers.js - keep updated
const STATUS_MAP = {
	offline: 0,
	online: 1,
	away: 2,
	busy: 3,
};

UserPresenceEvents.on('setUserStatus', (user, status/* , statusConnection*/) => {
	const {
		_id,
		username,
		statusText,
	} = user;

	// since this callback can be called by only one instance in the cluster
	// we need to broadcast the change to all instances
	Notifications.notifyLogged('user-status', [
		_id,
		username,
		STATUS_MAP[status],
		statusText,
	]);
});

import { UserPresenceEvents } from 'meteor/konecty:user-presence';

UserPresenceEvents.on('setUserStatus', (user, status/* , statusConnection*/) => {
	const {
		_id,
		username,
		name,
		utcOffset,
	} = user;

	// since this callback can be called by only one instance in the cluster
	// we need to brodcast the change to all instances
	RocketChat.Notifications.notifyLogged('user-status', {
		_id,
		username,
		name,
		status,
		utcOffset,
	});
});

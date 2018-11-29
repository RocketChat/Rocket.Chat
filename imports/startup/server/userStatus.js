import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

UserPresenceMonitor.onSetUserStatus((user, status/* , statusConnection*/) => {
	const {
		_id,
		username,
		name,
		utcOffset,
	} = user;
	RocketChat.Notifications.notifyLoggedInThisInstance('user-status', {
		_id,
		username,
		name,
		status,
		utcOffset,
	});
});

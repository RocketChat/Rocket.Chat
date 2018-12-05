import memoize from 'mem';
import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

export const emitStatus = memoize((_id, username, name, utcOffset, status) => {
	RocketChat.Notifications.notifyLoggedInThisInstance('user-status', {
		_id,
		username,
		name,
		status,
		utcOffset,
	});
}, { maxAge: 5000 });

UserPresenceMonitor.onSetUserStatus((user, status/* , statusConnection*/) => {
	const {
		_id,
		username,
		name,
		utcOffset,
	} = user;

	emitStatus(_id, username, name, utcOffset, status);
});

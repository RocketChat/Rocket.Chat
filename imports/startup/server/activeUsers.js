import { UserPresenceMonitor } from 'meteor/konecty:user-presence';
import memoize from 'mem';

const emitStatus = memoize((user, status) => {
	const {
		_id,
		username,
		name,
		utcOffset,
	} = user;

	RocketChat.Notifications.notifyLogged('user-status', {
		_id,
		username,
		name,
		status,
		utcOffset,
	});
}, { maxAge: 5000 });

UserPresenceMonitor.onSetUserStatus((user, status/* , statusConnection*/) => {
	emitStatus(user, status);
});

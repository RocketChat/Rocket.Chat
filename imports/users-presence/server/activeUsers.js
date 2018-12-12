import { UserPresenceEvents } from 'meteor/konecty:user-presence';

export const emitStatus = (_id, username, name, utcOffset, status) => {
	RocketChat.Notifications.notifyLoggedInThisInstance('user-status', {
		_id,
		username,
		name,
		status,
		utcOffset,
	});
};

UserPresenceEvents.on('setUserStatus', (user, status/* , statusConnection*/) => {
	const {
		_id,
		username,
		name,
		utcOffset,
	} = user;

	emitStatus(_id, username, name, utcOffset, status);
});

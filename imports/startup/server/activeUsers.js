import memoize from 'fast-memoize';
import { Meteor } from 'meteor/meteor';
import { PresenceStream } from 'meteor/konecty:user-presence';

const emitStatus = memoize((_id, username, name, utcOffset, status) => {
	RocketChat.Notifications.notifyLoggedInThisInstance('user-status', {
		_id,
		username,
		name,
		status,
		utcOffset,
	});
}, { maxAge: 5000 });

Meteor.startup(() => {
	PresenceStream.on('change', ({
		_id,
		username,
		name,
		status,
		utcOffset,
	}) => {
		emitStatus(_id, username, name, utcOffset, status);
	});
});

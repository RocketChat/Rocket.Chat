import { Meteor } from 'meteor/meteor';
import { emitStatus } from './activeUsers';

export const PresenceStream = new Meteor.Streamer('user-presence', { retransmit: false, retransmitToSelf: true });
PresenceStream.serverOnly = true;
PresenceStream.allowRead('none');
PresenceStream.allowEmit('all');
PresenceStream.allowWrite('none');

PresenceStream.on('change', ({
	_id,
	username,
	name,
	status,
	utcOffset,
}) => {
	emitStatus(_id, username, name, utcOffset, status);
});

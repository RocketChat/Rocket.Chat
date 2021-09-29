import { Meteor } from 'meteor/meteor';

import { Presence, STATUS_MAP } from '../../../../client/lib/presence';

(Meteor as any).StreamerCentral.on('stream-user-presence', (uid, args) => {
	const [username, status, statusText] = args;
	Presence.notify({ _id: uid, username, status: STATUS_MAP[status], statusText });
});

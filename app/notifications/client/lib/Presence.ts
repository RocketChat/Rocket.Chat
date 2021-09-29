import { Meteor } from 'meteor/meteor';

import { Presence, STATUS_MAP } from '../../../../client/lib/presence';

(Meteor as any).StreamerCentral.on('stream-user-presence', (uid: string, args: unknown) => {
	if (!Array.isArray(args)) {
		throw new Error('Presence event must be an array');
	}
	const [username, status, statusText] = args as [string, number, string | undefined];
	Presence.notify({ _id: uid, username, status: STATUS_MAP[status], statusText });
});

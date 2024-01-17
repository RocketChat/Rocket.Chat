import type { StreamerEvents } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { Presence, STATUS_MAP } from '../../../../client/lib/presence';

// TODO implement API on Streamer to be able to listen to all streamed data
// this is a hacky way to listen to all streamed data from user-presence Streamer

new Meteor.Streamer('user-presence');

(Meteor as any).StreamerCentral.on('stream-user-presence', (uid: string, ...args: StreamerEvents['user-presence'][number]['args']) => {
	if (!Array.isArray(args)) {
		throw new Error('Presence event must be an array');
	}
	const [[username, status, statusText]] = args;
	Presence.notify({ _id: uid, username, status: STATUS_MAP[status ?? 0], statusText });
});

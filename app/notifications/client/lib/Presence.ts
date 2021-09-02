import { Stream } from 'stream';

import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';


import { Presence, STATUS_MAP } from '../../../../client/lib/presence';

// Meteor.onConnection((connection) => {
(Meteor as unknown as { connection: Meteor.Connection & { _stream: Stream } }).connection._stream.on('message', (rawMsg: string) => {
	const msg = DDPCommon.parseDDP(rawMsg);
	if (msg.msg !== 'changed' || msg.collection !== 'stream-user-presences') {
		return;
	}

	const { uid, args } = msg.fields;
	const [[username, status, statusText]] = args;
	Presence.notify({ _id: uid, username, status: STATUS_MAP[status], statusText });
});
// });

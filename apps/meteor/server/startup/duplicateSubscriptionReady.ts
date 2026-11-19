import { Meteor } from 'meteor/meteor';

type DDPSession = {
	_namedSubs?: Map<string, { _ready?: boolean }>;
	sendReady(subscriptionIds: string[]): void;
};

// Mobile re-sends subscriptions it already holds and waits for their `ready`, which Meteor
// never repeats; acknowledge them again so the client gets the same answer ddp-streamer gives.
// Relies on ddp-server internals (`_namedSubs`, `_ready`) as of ddp-server 3.4.0.
(Meteor.server as unknown as { onMessage(fn: (msg: { msg: string; id?: string }, session: DDPSession) => void): void }).onMessage(
	(msg, session) => {
		if (msg.msg !== 'sub' || !msg.id) {
			return;
		}

		if (session._namedSubs?.get(msg.id)?._ready) {
			session.sendReady([msg.id]);
		}
	},
);

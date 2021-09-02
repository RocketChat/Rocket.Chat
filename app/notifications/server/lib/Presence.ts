import { DDPCommon } from 'meteor/ddp-common';
import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';

import { IUser } from '../../../../definition/IUser';

type UserPresenseStreamProps = {
	added: IUser['_id'][];
	removed: IUser['_id'][];
}

type UserPresenseStreamArgs = {
	'uid': string;
	args: unknown;
}

const e = new Emitter<{
	[key: string]: UserPresenseStreamArgs;
}>();


const clients = new WeakMap<Meteor.Connection, UserPresence>();

class UserPresence {
	private readonly publication: Subscription;

	private readonly listeners: Set<string>;

	constructor(publication: Subscription) {
		this.listeners = new Set();
		this.publication = publication;
	}

	listen(uid: string): void {
		if (this.listeners.has(uid)) {
			return;
		}
		e.on(uid, this.run);
		this.listeners.add(uid);
	}

	off = (uid: string): void => {
		e.off(uid, this.run);
		this.listeners.delete(uid);
	}

	run = (args: UserPresenseStreamArgs): void => {
		(this.publication as any)._session.socket.send(DDPCommon.stringifyDDP({
			msg: 'changed',
			collection: 'stream-user-presences',
			id: args.uid,
			fields: args,
		}));
	}

	stop(): void {
		this.listeners.forEach(this.off);
		clients.delete(this.publication.connection as Meteor.Connection);
	}
}

Meteor.publish('streamer-user-presences', function({ added, removed }: UserPresenseStreamProps) {
	const stored = clients.get(this.connection);

	const client = stored || new UserPresence(this);

	const main = Boolean(!stored);

	clients.set(this.connection, client);

	added?.forEach((uid) => client.listen(uid));
	removed?.forEach((uid) => client.off(uid));


	if (!main) {
		this.stop();
		return;
	}

	this.ready();
	this.connection.onClose(() => client.stop());

	this.onStop(() => client.stop());
});

export const emit = (uid: string, args: UserPresenseStreamArgs): void => e.emit(uid, { uid, args });

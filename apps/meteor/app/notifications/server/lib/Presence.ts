import { Emitter } from '@rocket.chat/emitter';
import type { IPublication, IStreamerConstructor, Connection, IStreamer } from 'meteor/rocketchat:streamer';
import type { IUser } from '@rocket.chat/core-typings';

export type UserPresenceStreamProps = {
	added: IUser['_id'][];
	removed: IUser['_id'][];
};

export type UserPresenceStreamArgs = {
	uid: string;
	args: unknown;
};

const e = new Emitter<{
	[key: string]: UserPresenceStreamArgs;
}>();

const clients = new WeakMap<Connection, UserPresence>();

export class UserPresence {
	private readonly streamer: IStreamer;

	private readonly publication: IPublication;

	private readonly listeners: Set<string>;

	constructor(publication: IPublication, streamer: IStreamer) {
		this.listeners = new Set();
		this.publication = publication;
		this.streamer = streamer;
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
	};

	run = (args: UserPresenceStreamArgs): void => {
		const payload = this.streamer.changedPayload(this.streamer.subscriptionName, args.uid, { ...args, eventName: args.uid }); // there is no good explanation to keep eventName, I just want to save one 'DDPCommon.parseDDP' on the client side, so I'm trying to fit the Meteor Streamer's payload
		(this.publication as any)._session.socket.send(payload);
	};

	stop(): void {
		this.listeners.forEach(this.off);
		clients.delete(this.publication.connection);
	}

	static getClient(publication: IPublication, streamer: IStreamer): [UserPresence, boolean] {
		const { connection } = publication;
		const stored = clients.get(connection);

		const client = stored || new UserPresence(publication, streamer);

		const main = Boolean(!stored);

		clients.set(connection, client);

		return [client, main];
	}
}

export class StreamPresence {
	static getInstance(Streamer: IStreamerConstructor, name = 'user-presence'): IStreamer {
		return new (class StreamPresence extends Streamer {
			async _publish(
				publication: IPublication,
				_eventName: string,
				options: boolean | { useCollection?: boolean; args?: any } = false,
			): Promise<void> {
				const { added, removed } = (typeof options !== 'boolean' ? options : {}) as unknown as UserPresenceStreamProps;

				const [client, main] = UserPresence.getClient(publication, this);

				added?.forEach((uid) => client.listen(uid));
				removed?.forEach((uid) => client.off(uid));

				if (!main) {
					publication.stop();
					return;
				}

				publication.ready();

				publication.onStop(() => client.stop());
			}
		} as any)(name);
	}
}
export const emit = (uid: string, args: UserPresenceStreamArgs): void => {
	e.emit(uid, { uid, args });
};

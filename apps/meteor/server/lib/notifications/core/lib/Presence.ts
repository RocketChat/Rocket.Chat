import { StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { USER_STATUS_TO_PRESENCE_CODE, UserStatus } from '@rocket.chat/core-typings';
import type { StreamerEvents } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';

import { Streamer } from '../../../../modules/streamer/streamer.module';
import type { IPublication, IStreamerConstructor, Connection, IStreamer } from '../../../../modules/streamer/types';

type UserPresenceStreamProps = {
	added: IUser['_id'][];
	removed: IUser['_id'][];
};

type UserPresenceStreamArgs = {
	uid: string;
	args: StreamerEvents['user-presence'][number]['args'];
};

const e = new Emitter<{
	[key: string]: UserPresenceStreamArgs;
}>();

const clients = new WeakMap<Connection, UserPresence>();

// The per-connection lists above cannot be reached through a WeakMap, so live clients are tracked here
// to be refreshed when block lists change.
const liveClients = new Set<UserPresence>();

class UserPresence {
	private readonly streamer: IStreamer<'user-presence'>;

	private readonly publication: IPublication;

	private readonly listeners: Set<string>;

	// Who this connection's viewer may not see. Fetched once per subscription so `run`, an emitter
	// callback returning void, can stay synchronous.
	private hiddenFrom = new Set<IUser['_id']>();

	constructor(publication: IPublication, streamer: IStreamer<'user-presence'>) {
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

	async refreshHiddenFrom(): Promise<void> {
		this.hiddenFrom = new Set(await StatusVisibility.getHiddenFrom(this.publication._session?.userId));
	}

	run = (args: UserPresenceStreamArgs): void => {
		const visiblePresence: UserPresenceStreamArgs = this.hiddenFrom.has(args.uid)
			? { uid: args.uid, args: [[args.args[0][0], USER_STATUS_TO_PRESENCE_CODE[UserStatus.OFFLINE]]] }
			: args;
		const payload = this.streamer.changedPayload(this.streamer.subscriptionName, args.uid, { ...visiblePresence, eventName: args.uid }); // there is no good explanation to keep eventName, I just want to save one 'DDPCommon.parseDDP' on the client side, so I'm trying to fit the Meteor Streamer's payload
		if (!payload) {
			return;
		}
		// after meteor 3.4.1 immediately after a disconnection session becomes null (which is not wrong)
		// we were just not counting on this, session is _session so we actually should not use it
		// now after any await, the session can potentially be null, so we need to check for that
		if (!Streamer.isPublicationActive(this.publication)) {
			return;
		}

		this.publication._session.socket.send(payload);
	};

	isActive(): boolean {
		return Streamer.isPublicationActive(this.publication);
	}

	stop(): void {
		this.listeners.forEach(this.off);
		clients.delete(this.publication.connection);
		liveClients.delete(this);
	}

	static getClient(publication: IPublication, streamer: IStreamer<'user-presence'>): [UserPresence, boolean] {
		const { connection } = publication;
		const stored = clients.get(connection);

		const client = stored || new UserPresence(publication, streamer);

		const main = Boolean(!stored);

		clients.set(connection, client);
		liveClients.add(client);

		return [client, main];
	}
}

export class StreamPresence {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	static getInstance(Streamer: IStreamerConstructor, name = 'user-presence'): IStreamer<'user-presence'> {
		return new (class StreamPresence extends Streamer<'user-presence'> {
			override async _publish(
				publication: IPublication,
				_eventName: string,
				options: boolean | { useCollection?: boolean; args?: any } = false,
			): Promise<void> {
				const { added, removed } = (typeof options !== 'boolean' ? options : {}) as unknown as UserPresenceStreamProps;

				const [client, main] = UserPresence.getClient(publication, this);

				await client.refreshHiddenFrom();

				if (!client.isActive()) {
					if (main) {
						client.stop();
					}

					return;
				}

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

export const emit = (uid: string, args: UserPresenceStreamArgs['args']): void => {
	e.emit(uid, { uid, args });
};

export const refreshVisibility = async (): Promise<void> => {
	await Promise.all([...liveClients].map((client) => client.refreshHiddenFrom()));
};

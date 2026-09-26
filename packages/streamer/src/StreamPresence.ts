import type { PresenceScope } from '@rocket.chat/core-services';
import { StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { USER_STATUS_TO_PRESENCE_CODE, UserStatus } from '@rocket.chat/core-typings';
import type { StreamerEvents } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';

import { statusVisibilityGate } from './StatusVisibilityGate';
import { NOTHING_HIDDEN, isHiddenFor } from './presenceScope';
import { Streamer } from './streamer.module';
import type { IPublication, IStreamerConstructor, Connection, IStreamer } from './types';

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

// mirror of `clients`, which cannot be enumerated
const liveClients = new Set<UserPresence>();

class UserPresence {
	private readonly streamer: IStreamer<'user-presence'>;

	private readonly publication: IPublication;

	private readonly listeners: Set<string>;

	private scope: PresenceScope = NOTHING_HIDDEN;

	private pendingCorrections = new Set<IUser['_id']>();

	private refreshing: Promise<void> = Promise.resolve();

	private stale = true;

	constructor(publication: IPublication, streamer: IStreamer<'user-presence'>) {
		this.listeners = new Set();
		this.publication = publication;
		this.streamer = streamer;
	}

	listen(uid: string): void {
		if (this.listeners.has(uid)) {
			return;
		}
		if (isHiddenFor(this.scope, uid)) {
			this.pendingCorrections.add(uid);
		}
		e.on(uid, this.run);
		this.listeners.add(uid);
	}

	off = (uid: string): void => {
		e.off(uid, this.run);
		this.listeners.delete(uid);
	};

	get isStale() {
		return this.stale;
	}

	async refreshHiddenUsers(): Promise<void> {
		this.refreshing = this.refreshing.catch(() => undefined).then(() => this.applyHiddenUsers());
		return this.refreshing;
	}

	private async applyHiddenUsers(): Promise<void> {
		if (!(await statusVisibilityGate.ensureActive())) {
			this.scope = NOTHING_HIDDEN;
			this.pendingCorrections = new Set();
			this.stale = false;
			return;
		}

		try {
			const scope = await StatusVisibility.getHiddenFrom(this.publication._session?.userId);
			const previous = this.scope;

			this.scope = scope;
			this.pendingCorrections = new Set(
				[...this.listeners].filter((uid) => isHiddenFor(scope, uid) && (!isHiddenFor(previous, uid) || this.pendingCorrections.has(uid))),
			);
			this.stale = false;
		} catch (error) {
			this.stale = true;
			throw error;
		}
	}

	run = (args: UserPresenceStreamArgs): void => {
		const hidden = isHiddenFor(this.scope, args.uid);

		if (hidden && !this.pendingCorrections.delete(args.uid)) {
			return;
		}

		const visiblePresence: UserPresenceStreamArgs = hidden
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

	get viewerId(): IUser['_id'] | undefined {
		return this.publication._session?.userId;
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
	static getInstance(StreamerClass: IStreamerConstructor, name = 'user-presence'): IStreamer<'user-presence'> {
		return new (
			class StreamPresence extends StreamerClass<'user-presence'> {
				override async _publish(
					publication: IPublication,
					_eventName: string,
					options: boolean | { useCollection?: boolean; args?: any } = false,
				): Promise<void> {
					const { added, removed } = (typeof options !== 'boolean' ? options : {}) as unknown as UserPresenceStreamProps;

					const [client, main] = UserPresence.getClient(publication, this);

					if (client.isStale) {
						try {
							await client.refreshHiddenUsers();
						} catch (error) {
							if (main) {
								client.stop();
								throw error;
							}
						}
					}

					if (!Streamer.isPublicationActive(publication)) {
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
			} as any
		)(name);
	}
}

export const emit = (uid: string, args: UserPresenceStreamArgs['args']): void => {
	e.emit(uid, { uid, args });
};

// no viewers means the setting itself changed, so every client has to re-pull
export const refreshVisibility = async (viewers?: IUser['_id'][]): Promise<void> => {
	const affected = viewers && new Set(viewers);
	const clients = affected ? Array.from(liveClients).filter(({ viewerId }) => viewerId && affected.has(viewerId)) : liveClients;

	await Promise.allSettled(Array.from(clients, (client) => client.refreshHiddenUsers()));
};

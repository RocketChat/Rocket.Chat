import { Room } from 'livekit-client';

import type { RemoteSFU, RemoteSFUConnection } from './callConnections';

export type RemoteSFUCredentials = { serverUrl: string; token: string };

/**
 * The subscribe-only connections a federated call holds to other homeservers' SFUs: one per SFU that has members in
 * the call, opened when it first appears and closed once it is no longer wanted. Nothing is ever published on them.
 */
export class RemoteSFUConnections {
	private connections: readonly RemoteSFUConnection[] = [];

	private readonly listeners = new Set<() => void>();

	constructor(private readonly createRoom: () => Room = () => new Room()) {}

	/**
	 * Connects to every SFU in `wanted` not connected yet, with credentials asked for as it appears, and disconnects
	 * from those no longer in it. One that fails is dropped and reported, so it is asked again when `wanted` next changes.
	 */
	sync(
		wanted: readonly RemoteSFU[],
		credentialsFor: (sfu: RemoteSFU) => Promise<RemoteSFUCredentials>,
		onError: (error: unknown) => void,
	): void {
		const wantedKeys = new Set(wanted.map(({ key }) => key));
		const kept = this.connections.filter(({ sfu, room }) => {
			if (wantedKeys.has(sfu.key)) {
				return true;
			}
			void room.disconnect();
			return false;
		});

		const keptKeys = new Set(kept.map(({ sfu }) => sfu.key));
		const opened = wanted.filter(({ key }) => !keptKeys.has(key)).map((sfu) => this.open(sfu, credentialsFor, onError));

		if (opened.length > 0 || kept.length !== this.connections.length) {
			this.update([...kept, ...opened]);
		}
	}

	close(): void {
		this.connections.forEach(({ room }) => void room.disconnect());
		this.update([]);
	}

	readonly subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	readonly getSnapshot = (): readonly RemoteSFUConnection[] => this.connections;

	private open(
		sfu: RemoteSFU,
		credentialsFor: (sfu: RemoteSFU) => Promise<RemoteSFUCredentials>,
		onError: (error: unknown) => void,
	): RemoteSFUConnection {
		const connection = { sfu, room: this.createRoom() };
		const isOpen = () => this.connections.includes(connection);

		credentialsFor(sfu)
			.then(({ serverUrl, token }) => (isOpen() ? connection.room.connect(serverUrl, token) : undefined))
			.catch((error: unknown) => {
				// A connection closed on purpose fails its pending connect; that is not worth reporting.
				if (!isOpen()) {
					return;
				}
				void connection.room.disconnect();
				this.update(this.connections.filter((other) => other !== connection));
				onError(error);
			});

		return connection;
	}

	private update(connections: readonly RemoteSFUConnection[]): void {
		this.connections = connections;
		this.listeners.forEach((listener) => listener());
	}
}

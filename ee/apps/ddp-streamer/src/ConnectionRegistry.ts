import WebSocket from 'ws';

import type { Client } from './Client';
import type { ConnectionLifecycle } from './lifecycle';

const FORCE_LOGOUT_GRACE_MS = 5000;

/** The clients currently connected to this process, with the ways the service is allowed to disconnect them. */
export class ConnectionRegistry {
	private readonly clients = new Set<Client>();

	constructor(lifecycle: ConnectionLifecycle) {
		lifecycle.on('connected', (client) => this.clients.add(client));
		lifecycle.on('disconnected', (client) => this.clients.delete(client));
	}

	get size(): number {
		return this.clients.size;
	}

	closeSession(sessionId: string): void {
		for (const client of this.clients) {
			if (client.connection.id === sessionId) {
				client.ws.close();
			}
		}
	}

	/**
	 * Closes every socket of the user gracefully so frames already queued (such as the force_logout stream message)
	 * still reach the client, and terminates any socket that has not finished closing within the grace period.
	 */
	closeForUser(userId: string): void {
		for (const client of this.clients) {
			if (client.userId !== userId) {
				continue;
			}

			const { ws } = client;
			ws.close();
			const guard = setTimeout(() => {
				if (ws.readyState !== WebSocket.CLOSED) {
					ws.terminate();
				}
			}, FORCE_LOGOUT_GRACE_MS);
			ws.once('close', () => clearTimeout(guard));
		}
	}

	terminateAll(): void {
		for (const client of this.clients) {
			client.ws.terminate();
		}
	}
}

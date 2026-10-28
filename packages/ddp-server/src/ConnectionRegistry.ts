import WebSocket from 'ws';

import type { Session } from './Session';
import type { ConnectionLifecycle } from './lifecycle';

const FORCE_LOGOUT_GRACE_MS = 5000;

/** The live sessions of this process, and the ways the service may end them. */
export class ConnectionRegistry {
	private readonly sessions = new Set<Session>();

	constructor(lifecycle: ConnectionLifecycle) {
		lifecycle.on('connected', (session) => this.sessions.add(session));
		lifecycle.on('disconnected', (session) => this.sessions.delete(session));
	}

	get size(): number {
		return this.sessions.size;
	}

	/** The user of every logged-in session, repeated for a user with several sessions. */
	userIds(): string[] {
		return Array.from(this.sessions, (session) => session.userId).filter((userId): userId is string => !!userId);
	}

	closeSession(sessionId: string): void {
		for (const session of this.sessions) {
			if (session.connection.id === sessionId) {
				session.ws.close();
			}
		}
	}

	/**
	 * Closes every socket of the user gracefully so frames already queued (such as the force_logout stream message)
	 * still reach the client, and terminates any socket that has not finished closing within the grace period.
	 */
	closeForUser(userId: string): void {
		for (const session of this.sessions) {
			if (session.userId !== userId) {
				continue;
			}

			const { ws } = session;
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
		for (const session of this.sessions) {
			session.ws.terminate();
		}
	}
}

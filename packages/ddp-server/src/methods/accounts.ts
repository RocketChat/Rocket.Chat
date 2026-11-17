import WebSocket from 'ws';

import type { Server } from '../Server';
import type { Session } from '../Session';
import { WS_ERRORS } from '../constants';
import type { ConnectionLifecycle } from '../lifecycle';

/** What the `login` method answers a client with. */
export type LoginResult = { id: string; token: string; tokenExpires?: Date; type: string };

/** Where a server's sessions log in and out. */
export type SessionAccounts = {
	/** Logs `session` in with the `login` method's parameters, throwing the error the client gets when it can't. */
	login(session: Session, params: unknown[]): Promise<{ result: LoginResult; hashedToken: string }>;
	logout(session: Session): Promise<void>;
};

/**
 * Registers `login` and `logout`, which keep a session's user in step with `accounts` and announce each change on
 * `lifecycle`.
 */
export function registerAccountMethods(server: Server, lifecycle: ConnectionLifecycle, accounts: SessionAccounts): void {
	server.methods({
		async login(...params: unknown[]) {
			const { result, hashedToken } = await accounts.login(this, params);

			this.userId = result.id;
			this.userToken = hashedToken;
			this.connection.loginToken = hashedToken;

			// a socket that closed while logging in already reported its disconnection, so nothing would undo the login
			if (this.ws.readyState === WebSocket.OPEN) {
				lifecycle.emit('loggedIn', this);
			}

			return result;
		},
		async logout() {
			await accounts.logout(this);

			lifecycle.emit('loggedOut', this);

			this.userToken = undefined;
			this.userId = undefined;

			// Meteor tears down every subscription after a logout result so the client re-subscribes to the defaults;
			// closing the socket after the result is sent gives the same effect:
			// https://github.com/meteor/meteor/blob/2377ebe879d9b965d699f599392d4e8047eb7d78/packages/ddp-server/livedata_server.js#L781
			setTimeout(() => {
				this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
			}, 1);
		},
	});
}

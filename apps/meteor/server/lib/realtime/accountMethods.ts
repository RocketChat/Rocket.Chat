import { hashLoginToken } from '@rocket.chat/account-utils';
import type { ConnectionLifecycle, Server } from '@rocket.chat/ddp-server';
import { WS_ERRORS } from '@rocket.chat/ddp-server';

import { callMeteorMethod } from './meteorMethods';

type LoginResult = { id: string; token: string; tokenExpires: Date; type: string };

/**
 * Logs sessions in and out through Meteor's own `login` and `logout` methods, so every Accounts hook still runs.
 */
export const registerAccountMethods = (server: Server, lifecycle: ConnectionLifecycle): void => {
	server.methods({
		async login(...params: unknown[]) {
			const result = (await callMeteorMethod(this, 'login', params)) as LoginResult;

			this.userId = result.id;
			this.userToken = hashLoginToken(result.token);
			this.connection.loginToken = this.userToken;

			// a socket that closed while logging in already reported its disconnection, so nothing would undo the login
			if (this.ws.readyState === this.ws.OPEN) {
				lifecycle.emit('loggedIn', this);
			}

			return result;
		},
		async logout() {
			await callMeteorMethod(this, 'logout', []);

			lifecycle.emit('loggedOut', this);

			this.userId = undefined;
			this.userToken = undefined;

			// Meteor drops every subscription after logout so the client starts over; closing the socket once the
			// result is out has the same effect.
			setTimeout(() => {
				this.ws.close(WS_ERRORS.CLOSE_PROTOCOL_ERROR);
			}, 1);
		},
	});
};

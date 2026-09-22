import { Account, MeteorError } from '@rocket.chat/core-services';

import type { Server } from '../Server';
import { DDP_EVENTS, WS_ERRORS } from '../constants';

export function registerAccountMethods(server: Server): void {
	server.methods({
		async login({ resume }: { resume: string }) {
			const result = await Account.login({ resume });
			if (!result) {
				throw new MeteorError(403, "You've been logged out by the server. Please log in again");
			}

			this.userId = result.uid;
			this.userToken = result.hashedToken;
			this.connection.loginToken = result.hashedToken;

			this.emit(DDP_EVENTS.LOGGED);

			server.emit(DDP_EVENTS.LOGGED, this);

			return {
				id: result.uid,
				token: result.token,
				tokenExpires: result.tokenExpires,
				type: result.type,
			};
		},
		async logout() {
			if (this.userToken && this.userId) {
				await Account.logout({ userId: this.userId, token: this.userToken });
			}

			this.emit(DDP_EVENTS.LOGGEDOUT);
			server.emit(DDP_EVENTS.LOGGEDOUT, this);

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

import type { ISocketConnection, LoginSessionPayload, LogoutSessionPayload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

export const sauEvents = new Emitter<{
	'sau.accounts.login': LoginSessionPayload;
	'sau.accounts.logout': LogoutSessionPayload;
	'sau.socket.connected': ISocketConnection;
	'sau.socket.disconnected': ISocketConnection;
}>();

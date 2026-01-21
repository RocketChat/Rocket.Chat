import type { ISocketConnection, LoginSessionPayload, LogoutSessionPayload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

export const sauEvents = new Emitter<{
	'accounts.login': LoginSessionPayload;
	'accounts.logout': LogoutSessionPayload;
	'socket.connected': ISocketConnection;
	'socket.disconnected': ISocketConnection;
}>();

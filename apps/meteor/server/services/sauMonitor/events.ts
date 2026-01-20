import type { ISocketConnection, LoginSessionPayload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

export const sauEvents = new Emitter<{
	'accounts.login': LoginSessionPayload;
	'accounts.logout': { userId: string; connection: ISocketConnection };
	'socket.connected': ISocketConnection;
	'socket.disconnected': ISocketConnection;
}>();

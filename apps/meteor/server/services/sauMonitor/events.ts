import type { ISocketConnection, ISocketConnectionLogged } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

export const sauEvents = new Emitter<{
	'accounts.login': { userId: string; connection: ISocketConnectionLogged };
	'accounts.logout': { userId: string; connection: ISocketConnection };
	'socket.connected': ISocketConnection;
	'socket.disconnected': ISocketConnection;
}>();

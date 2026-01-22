import type {
	LoginSessionPayload,
	LogoutSessionPayload,
	SocketConnectedPayload,
	SocketDisconnectedPayload,
} from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

export const sauEvents = new Emitter<{
	'sau.accounts.login': LoginSessionPayload;
	'sau.accounts.logout': LogoutSessionPayload;
	'sau.socket.connected': SocketConnectedPayload;
	'sau.socket.disconnected': SocketDisconnectedPayload;
}>();

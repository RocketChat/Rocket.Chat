import { Emitter } from '@rocket.chat/emitter';

export const sauEvents = new Emitter<{
	'accounts.login': any;
	'accounts.logout': any;
	'socket.connected': any;
	'socket.disconnected': any;
}>();

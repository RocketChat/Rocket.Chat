import WebSocket from 'ws';

import { DDPSDK } from '../src/DDPSDK';

(global as any).WebSocket = global.WebSocket || WebSocket;

const run = async (url: string, token: string) => {
	const sdk = await DDPSDK.createAndConnect(url);

	try {
		if (!token) {
			throw new Error('Token is required');
		}

		await sdk.account.loginWithToken(token);

		await sdk.stream('notify-room', 'GENERAL/user-activity', (args) =>
			console.log('notify-user -> GENERAL/user-activity', JSON.stringify(args, undefined, 2)),
		);
		await sdk.stream('notify-user', 'GENERAL/rooms-changed', (args) =>
			console.log('notify-user -> GENERAL/rooms-changed', JSON.stringify(args, undefined, 2)),
		);

		await sdk.stream('room-messages', 'GENERAL', (message) =>
			console.log('room-messages -> GENERAL', JSON.stringify(message, undefined, 2)),
		);
		await sdk.stream('roles', 'roles', (args) => console.log('roles -> roles', JSON.stringify(args, undefined, 2)));

		console.log('ROOMS', await sdk.client.callAsync('subscriptions/get'));
	} catch (error) {
		console.log('error', error);
	}

	return sdk;
};

(async () => {
	await run('wss://unstable.rocket.chat/websocket', process.env.INSTANCE_TOKEN || '');
})();

import WebSocket from 'ws';

import { DDPSDK } from '../src/DDPSDK';

(global as any).WebSocket = global.WebSocket || WebSocket;

const run = async (url: string, token: string) => {
	const sdk = await DDPSDK.create(url);

	try {
		await sdk.callAsync('login', { resume: token });
		console.log('ROOMS', await sdk.callAsync('subscriptions/get'));
		sdk.subscribe('stream-room-messages', 'GENERAL', false);

		sdk.onCollection('stream-room-messages', (data) => {
			console.log('stream-room-messages', data);
		});
	} catch (error) {
		console.log('error', error);
	}

	return sdk;
};

(async () => {
	await run('wss://unstable.rocket.chat/websocket', process.env.INSTANCE_TOKEN!);
})();

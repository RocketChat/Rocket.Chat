import WebSocket from 'ws';

import { DDPSDK } from '../src/DDPSDK';

(global as any).WebSocket = global.WebSocket || WebSocket;

const run = async (url: string, token: string) => {
	const sdk = await DDPSDK.create(url);

	try {
		await sdk.client.callAsync('login', { resume: token });
		console.log('ROOMS', await sdk.client.callAsync('subscriptions/get'));

		await sdk.stream('stream-room-messages', ['GENERAL'], (args) => console.log('STREAMER -> GENERAL', JSON.stringify(args, undefined, 2)));
	} catch (error) {
		console.log('error', error);
	}

	return sdk;
};

(async () => {
	await run('wss://unstable.rocket.chat/websocket', process.env.INSTANCE_TOKEN!);
})();

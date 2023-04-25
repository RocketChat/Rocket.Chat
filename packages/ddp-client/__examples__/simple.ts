import WebSocket from 'ws';
import type { ServerMethods, ServerMethodReturn } from '@rocket.chat/ui-contexts';
import type { ServerStreamerNames, StreamerEvents } from '@rocket.chat/ui-contexts/src/ServerContext/streams';

import { DDPSDK } from '../src/DDPSDK';

declare module '../src/ClientStream' {
	interface ClientStream {
		callAsync<MethodName extends keyof ServerMethods>(methodName: MethodName): ServerMethodReturn<MethodName>;
	}
}

declare module '../src/DDPSDK' {
	interface DDPSDK {
		stream<StreamName extends ServerStreamerNames>(
			streamName: StreamName,
			args: Parameters<StreamerEvents[StreamName]>[0],
			callback: Parameters<StreamerEvents[StreamName]>[1],
		): () => void;
	}
}

(global as any).WebSocket = global.WebSocket || WebSocket;

const run = async (url: string, token: string) => {
	const sdk = await DDPSDK.create(url);

	try {
		await sdk.account.loginWithToken(token);

		await sdk.stream('room-messages', 'GENERAL', (args) => console.log('room-messages -> GENERAL', JSON.stringify(args, undefined, 2)));
		await sdk.stream('roles', 'roles', (args) => console.log('roles -> roles', JSON.stringify(args, undefined, 2)));

		console.log('ROOMS', await sdk.client.callAsync('subscriptions/get'));
	} catch (error) {
		console.log('error', error);
	}

	return sdk;
};

(async () => {
	await run('wss://unstable.rocket.chat/websocket', process.env.INSTANCE_TOKEN!);
})();

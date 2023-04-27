import WebSocket from 'ws';
import type { ServerMethods, ServerMethodReturn } from '@rocket.chat/ui-contexts';
import type { StreamNames, StreamKeys, StreamerCallbackArgs } from '@rocket.chat/ui-contexts/src/ServerContext/streams';

import { DDPSDK } from '../src/DDPSDK';
import type { DDPDispatchOptions } from '../src/types/DDPClient';

declare module '../src/ClientStream' {
	interface ClientStream {
		callAsync<MethodName extends keyof ServerMethods>(
			methodName: MethodName,
			...params: Parameters<ServerMethods[MethodName]>
		): ServerMethodReturn<MethodName>;
		callAsyncWithOptions<MethodName extends keyof ServerMethods>(
			methodName: MethodName,
			options: DDPDispatchOptions,
			...params: Parameters<ServerMethods[MethodName]>
		): ServerMethodReturn<MethodName>;
	}
}

declare module '../src/DDPSDK' {
	interface DDPSDK {
		stream<N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			key: K,
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): () => void;
	}
}

(global as any).WebSocket = global.WebSocket || WebSocket;

const run = async (url: string, token: string) => {
	const sdk = await DDPSDK.create(url);

	try {
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
	await run('wss://unstable.rocket.chat/websocket', process.env.INSTANCE_TOKEN!);
})();

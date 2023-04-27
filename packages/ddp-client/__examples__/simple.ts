import WebSocket from 'ws';
import type { ServerMethods, ServerMethodReturn, ServerMethodFunction } from '@rocket.chat/ui-contexts';
import type { StreamNames, StreamKeys, StreamerCallbackArgs } from '@rocket.chat/ui-contexts/src/ServerContext/streams';

import { DDPSDK } from '../src/DDPSDK';
import type { DDPDispatchOptions } from '../src/types/DDPClient';
import { Emitter } from '@rocket.chat/emitter';
import { ClientStream } from '../src/ClientStream';

declare module '../src/ClientStream' {
	interface ClientStream {
		callAsync<MethodName extends keyof ServerMethods>(
			methodName: MethodName,
			...params: Parameters<ServerMethods[MethodName]>
		): Promise<ServerMethodReturn<MethodName>>;
		callAsyncWithOptions<MethodName extends keyof ServerMethods>(
			methodName: MethodName,
			options: DDPDispatchOptions,
			...params: Parameters<ServerMethods[MethodName]>
		): Promise<ServerMethodReturn<MethodName>>;
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
	const sdk = await DDPSDK.createAndConnect(url);

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

type LivechatRoomEvents<T> = StreamerCallbackArgs<'livechat-room', `${string}`> extends [infer A]
	? A extends { type: T; data: unknown }
		? A['data']
		: A extends { type: T; status: unknown }
		? A['status']
		: A extends { type: T; visitor: unknown }
		? A['visitor']
		: never
	: never;

type X = ClientStream['callAsync'];

interface LivechatClient {
	notifyVisitorTyping(rid: string, username: string, typing: boolean): Promise<unknown>;
	notifyCallDeclined(rid: string): Promise<unknown>;

	subscribeRoom(rid: string): Promise<any>;
	onMessage(cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void): () => void;
	onTyping(cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/typing`>) => void): () => void;

	onRoomMessage(rid: string, cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void);
	onRoomTyping(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/typing`>) => void);
	onRoomDeleteMessage(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>) => void);

	onAgentChange(rid: string, cb: (args: LivechatRoomEvents<'agentData'>) => void): () => void;
	onAgentStatusChange(rid: string, cb: (args: LivechatRoomEvents<'agentStatus'>) => void): () => void;
	onQueuePositionChange(rid: string, cb: (args: LivechatRoomEvents<'queueData'>) => void): () => void;
	onVisitorChange(rid: string, cb: (data: LivechatRoomEvents<'visitorData'>) => void): () => void;
}

export class LivechatClientImpl extends DDPSDK implements LivechatClient {
	private ev = new Emitter<{
		typing: StreamerCallbackArgs<'notify-room', `${string}/typing`>;
		message: StreamerCallbackArgs<'room-messages', string>;
		delete: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>;
	}>();

	subscribeRoom(rid: string) {
		return Promise.all([
			this.onRoomMessage(rid, (...args) => this.ev.emit('message', args)),
			this.onRoomTyping(rid, (...args) => this.ev.emit('typing', args)),
			this.onRoomDeleteMessage(rid, (...args) => this.ev.emit('delete', args)),
		]);
	}

	onMessage(cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void): () => void {
		return this.ev.on('message', (args) => cb(...args));
	}
	onTyping(cb: (username: string, activities: string) => void): () => void {
		return this.ev.on('typing', (args) => cb(...args));
	}

	onRoomMessage(rid: string, cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void) {
		this.stream('room-messages', rid, cb);
	}

	onRoomTyping(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/typing`>) => void) {
		return this.stream('notify-room', `${rid}/typing`, cb);
	}

	onRoomDeleteMessage(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>) => void) {
		return this.stream('notify-room', `${rid}/deleteMessage`, cb);
	}

	onAgentChange(rid: string, cb: (data: LivechatRoomEvents<'agentData'>) => void): () => void {
		return this.stream('livechat-room', rid, (data) => {
			if (data.type === 'agentData') {
				cb(data.data);
			}
		});
	}
	onAgentStatusChange(rid: string, cb: (data: LivechatRoomEvents<'agentStatus'>) => void): () => void {
		return this.stream('livechat-room', rid, (data) => {
			if (data.type === 'agentStatus') {
				cb(data.status);
			}
		});
	}

	onQueuePositionChange(rid: string, cb: (data: LivechatRoomEvents<'queueData'>) => void): () => void {
		return this.stream('livechat-room', rid, (data) => {
			if (data.type === 'queueData') {
				cb(data.data);
			}
		});
	}

	onVisitorChange(rid: string, cb: (data: LivechatRoomEvents<'visitorData'>) => void): () => void {
		return this.stream('livechat-room', rid, (data) => {
			if (data.type === 'visitorData') {
				cb(data.visitor);
			}
		});
	}

	notifyVisitorTyping(rid: string, username: string, typing: boolean) {
		return this.client.callAsync('stream-notify-room', `${rid}/typing`, username, typing);
	}

	notifyCallDeclined(rid: string) {
		return this.client.callAsync('stream-notify-room', `${rid}/call`, 'decline');
	}
}

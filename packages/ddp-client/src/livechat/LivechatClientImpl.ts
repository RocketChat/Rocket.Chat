import type { StreamNames, StreamKeys, StreamerCallbackArgs } from '@rocket.chat/ui-contexts/src/ServerContext/streams';
import type { ServerMethods, ServerMethodReturn } from '@rocket.chat/ui-contexts';
import { Emitter } from '@rocket.chat/emitter';

import type { DDPDispatchOptions } from '../types/DDPClient';
import type { LivechatClient, LivechatRoomEvents } from './types/LivechatSDK';
import { DDPSDK } from '../DDPSDK';

declare module '../ClientStream' {
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

declare module '../DDPSDK' {
	interface DDPSDK {
		stream<N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			key: K,
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): {
			stop: () => void;
			ready: () => Promise<void>;
			isReady: boolean;
			onReady: (cb: () => void) => void;
		};
	}
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
		return this.ev.on('typing', (args) => args[1] && cb(args[0], args[1]));
	}

	onRoomMessage(rid: string, cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void) {
		return this.stream('room-messages', rid, cb).stop;
	}

	onRoomTyping(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/typing`>) => void) {
		return this.stream('notify-room', `${rid}/typing`, cb).stop;
	}

	onRoomDeleteMessage(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>) => void) {
		return this.stream('notify-room', `${rid}/deleteMessage`, cb).stop;
	}

	onAgentChange(rid: string, cb: (data: LivechatRoomEvents<'agentData'>) => void): () => void {
		return this.stream('livechat-room', rid, (data) => {
			if (data.type === 'agentData') {
				cb(data.data);
			}
		}).stop;
	}

	onAgentStatusChange(rid: string, cb: (data: LivechatRoomEvents<'agentStatus'>) => void): () => void {
		return this.stream('livechat-room', rid, (data) => {
			if (data.type === 'agentStatus') {
				cb(data.status);
			}
		}).stop;
	}

	onQueuePositionChange(rid: string, cb: (data: LivechatRoomEvents<'queueData' | 'agentData'>) => void): () => void {
		return this.stream('livechat-room', rid, (data) => {
			if (data.type === 'queueData') {
				cb(data.data);
			}
		}).stop;
	}

	onVisitorChange(rid: string, cb: (data: LivechatRoomEvents<'visitorData'>) => void): () => void {
		return this.stream('livechat-room', rid, (data) => {
			if (data.type === 'visitorData') {
				cb(data.visitor);
			}
		}).stop;
	}

	notifyVisitorTyping(rid: string, username: string, typing: boolean) {
		return this.client.callAsync('stream-notify-room', `${rid}/typing`, username, typing);
	}

	notifyCallDeclined(rid: string) {
		return this.client.callAsync('stream-notify-room', `${rid}/call`, 'decline');
	}
}

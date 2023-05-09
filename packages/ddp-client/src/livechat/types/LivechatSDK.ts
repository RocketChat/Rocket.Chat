import type { StreamerCallbackArgs } from '@rocket.chat/ui-contexts/src/ServerContext/streams';

export type LivechatRoomEvents<T> = StreamerCallbackArgs<'livechat-room', `${string}`> extends [infer A]
	? A extends { type: T; data: unknown }
		? A['data']
		: A extends { type: T; status: unknown }
		? A['status']
		: A extends { type: T; visitor: unknown }
		? A['visitor']
		: never
	: never;

export interface LivechatClient {
	notifyVisitorTyping(rid: string, username: string, typing: boolean): Promise<unknown>;
	notifyCallDeclined(rid: string): Promise<unknown>;

	subscribeRoom(rid: string): Promise<any>;
	onMessage(cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void): () => void;
	onTyping(cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/typing`>) => void): () => void;

	onRoomMessage(rid: string, cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void): () => void;
	onRoomTyping(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/typing`>) => void): () => void;
	onRoomDeleteMessage(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>) => void): () => void;

	onAgentChange(rid: string, cb: (args: LivechatRoomEvents<'agentData'>) => void): () => void;
	onAgentStatusChange(rid: string, cb: (args: LivechatRoomEvents<'agentStatus'>) => void): () => void;
	onQueuePositionChange(rid: string, cb: (args: LivechatRoomEvents<'queueData'>) => void): () => void;
	onVisitorChange(rid: string, cb: (data: LivechatRoomEvents<'visitorData'>) => void): () => void;
}

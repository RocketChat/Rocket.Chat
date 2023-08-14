import type { Serialized } from '@rocket.chat/core-typings';
import type { OperationParams, OperationResult } from '@rocket.chat/rest-typings';

import type { StreamerCallbackArgs } from '../../types/streams';

export type LivechatRoomEvents<T> = StreamerCallbackArgs<'livechat-room', `${string}`> extends [infer A]
	? A extends { type: T; data: unknown }
		? A['data']
		: A extends { type: T; status: unknown }
		? A['status']
		: A extends { type: T; visitor: unknown }
		? A['visitor']
		: never
	: never;

export interface LivechatStream {
	notifyVisitorActivity(rid: string, username: string, activities: string[]): Promise<unknown>;
	notifyCallDeclined(rid: string): Promise<unknown>;

	subscribeRoom(rid: string): Promise<any>;
	onMessage(cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void): () => void;
	onUserActivity(cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/user-activity`>) => void): () => void;

	onRoomMessage(rid: string, cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void): () => void;
	onRoomUserActivity(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/user-activity`>) => void): () => void;
	onRoomDeleteMessage(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>) => void): () => void;

	onAgentChange(rid: string, cb: (args: LivechatRoomEvents<'agentData'>) => void): () => void;
	onAgentStatusChange(rid: string, cb: (args: LivechatRoomEvents<'agentStatus'>) => void): () => void;
	onQueuePositionChange(rid: string, cb: (args: LivechatRoomEvents<'queueData' | 'agentData'>) => void): () => void;
	onVisitorChange(rid: string, cb: (data: LivechatRoomEvents<'visitorData'>) => void): () => void;
}

export interface LivechatEndpoints {
	// GET
	config(args: OperationParams<'GET', '/v1/livechat/config'>): Promise<Serialized<OperationResult<'GET', '/v1/livechat/config'>['config']>>;
	room(args: OperationParams<'GET', '/v1/livechat/room'>): Promise<Serialized<OperationResult<'GET', '/v1/livechat/room'>>>;
	visitor(
		args: OperationParams<'GET', '/v1/livechat/visitor/:token'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/visitor/:token'>>>;
	nextAgent(
		args: OperationParams<'GET', '/v1/livechat/agent.next/:token'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/agent.next/:token'>>>;
	agent(rid: string): Promise<Serialized<OperationResult<'GET', '/v1/livechat/agent.info/:rid/:token'>['agent']>>;
	message(
		id: string,
		args: OperationParams<'GET', '/v1/livechat/message/:_id'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/message/:_id'>>>;
	loadMessages(
		rid: string,
		args: OperationParams<'GET', '/v1/livechat/messages.history/:rid'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/messages.history/:rid'>['messages']>>;
	// videoCall(args: OperationParams<'GET', '/v1/livechat/video.call/:token'>): Promise<void>;

	// POST
	transferChat(
		args: OperationParams<'POST', '/v1/livechat/room.transfer'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.transfer'>>>;
	grantVisitor(
		guest: OperationParams<'POST', '/v1/livechat/visitor'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor'>>>;
	login(guest: OperationParams<'POST', '/v1/livechat/visitor'>): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor'>>>;
	closeChat(args: { rid: string }): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.close'>>>;
	// shareScreen(args: OperationParams<'POST', '/v1/livechat/room.shareScreen'>): Promise<void>;
	chatSurvey(
		args: OperationParams<'POST', '/v1/livechat/room.survey'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.survey'>>>;
	updateVisitorStatus(status: string): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor.status'>['status']>>;
	updateCallStatus(
		callStatus: string,
		rid: string,
		callId: string,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor.callStatus'>>>;
	sendMessage(args: OperationParams<'POST', '/v1/livechat/message'>): Promise<Serialized<OperationResult<'POST', '/v1/livechat/message'>>>;
	sendOfflineMessage(
		args: OperationParams<'POST', '/v1/livechat/offline.message'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/offline.message'>>>;
	sendVisitorNavigation(
		args: OperationParams<'POST', '/v1/livechat/page.visited'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/page.visited'>>>;
	requestTranscript(email: string, { rid }: { rid: string }): Promise<Serialized<OperationResult<'POST', '/v1/livechat/transcript'>>>;
	sendCustomField(
		params: OperationParams<'POST', '/v1/livechat/custom.field'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/custom.field'>>>;
	sendCustomFields(
		params: OperationParams<'POST', '/v1/livechat/custom.fields'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/custom.fields'>>>;
	uploadFile(rid: string, file: File): Promise<ProgressEvent<EventTarget>>;

	// DELETE
	deleteMessage(id: string, { rid }: { rid: string }): Promise<Serialized<OperationResult<'DELETE', '/v1/livechat/message/:_id'>>>;
	deleteVisitor(args: OperationParams<'DELETE', '/v1/livechat/visitor/:token'>): Promise<void>;

	// PUT
	editMessage(
		id: string,
		args: OperationParams<'PUT', '/v1/livechat/message/:_id'>,
	): Promise<Serialized<OperationResult<'PUT', '/v1/livechat/message/:_id'>>>;

	sendUiInteraction(
		payload: OperationParams<'POST', '/apps/ui.interaction/:id'>,
		appId: string,
	): Promise<Serialized<OperationResult<'POST', '/apps/ui.interaction/:id'>>>;
}

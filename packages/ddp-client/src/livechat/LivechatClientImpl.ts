import type { StreamNames, StreamKeys, StreamerCallbackArgs } from '@rocket.chat/ui-contexts/src/ServerContext/streams';
import type { ServerMethods, ServerMethodReturn } from '@rocket.chat/ui-contexts';
import { Emitter } from '@rocket.chat/emitter';
import { RestClient } from '@rocket.chat/api-client';
import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import type { OperationParams, OperationResult } from '@rocket.chat/rest-typings';

import type { DDPDispatchOptions } from '../types/DDPClient';
import { DDPSDK } from '../DDPSDK';
import type { LivechatEndpoints, LivechatRoomEvents, LivechatStream } from './types/LivechatSDK';
import { DDPDispatcher } from '../DDPDispatcher';
import { ClientStreamImpl } from '../ClientStream';
import { ConnectionImpl } from '../Connection';
import { AccountImpl } from '../types/Account';
import { TimeoutControl } from '../TimeoutControl';
import type { ClientStream } from '../types/ClientStream';

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
			data: K | [K, unknown],
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): ReturnType<ClientStream['subscribe']>;
	}
}

export class LivechatClientImpl extends DDPSDK implements LivechatStream, LivechatEndpoints {
	private token?: string;

	public readonly credentials: { token?: string } = { token: this.token };

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

	onTyping(cb: (username: string, typing: boolean) => void): () => void {
		return this.ev.on('typing', (args) => args[1] && cb(args[0], args[1]));
	}

	onRoomMessage(rid: string, cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void) {
		return this.stream('room-messages', [rid, { token: this.token, visitorToken: this.token }], cb).stop;
	}

	onRoomTyping(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/typing`>) => void) {
		return this.stream('notify-room', [`${rid}/typing`, { token: this.token, visitorToken: this.token }], cb).stop;
	}

	onRoomDeleteMessage(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>) => void) {
		return this.stream('notify-room', [`${rid}/deleteMessage`, { token: this.token, visitorToken: this.token }], cb).stop;
	}

	onAgentChange(rid: string, cb: (data: LivechatRoomEvents<'agentData'>) => void): () => void {
		return this.stream('livechat-room', [rid, { token: this.token, visitorToken: this.token }], (data) => {
			if (data.type === 'agentData') {
				cb(data.data);
			}
		}).stop;
	}

	onAgentStatusChange(rid: string, cb: (data: LivechatRoomEvents<'agentStatus'>) => void): () => void {
		return this.stream('livechat-room', [rid, { token: this.token, visitorToken: this.token }], (data) => {
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
		return this.stream('livechat-room', [rid, { token: this.token, visitorToken: this.token }], (data) => {
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

	// API GETTERS

	async config(
		params: OperationParams<'GET', '/v1/livechat/config'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/config'>['config']>> {
		const { config } = await this.rest.get('/v1/livechat/config', params);
		return config;
	}

	async room(params: OperationParams<'GET', '/v1/livechat/room'>): Promise<Serialized<IOmnichannelRoom>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}

		const result = await this.rest.get('/v1/livechat/room', { ...params, token: this.token });

		// TODO: On major version bump, normalize the return of /v1/livechat/room
		function isRoomObject(
			room: Serialized<IOmnichannelRoom> | { room: Serialized<IOmnichannelRoom> },
		): room is { room: Serialized<IOmnichannelRoom> } {
			return (room as { room: Serialized<IOmnichannelRoom> }).room !== undefined;
		}

		if (isRoomObject(result)) {
			return result.room;
		}

		return result;
	}

	visitor(
		params: OperationParams<'GET', '/v1/livechat/visitor'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/visitor'>['visitor']>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		const endpoint = `/v1/livechat/visitor/${this.token}`;
		return this.rest.get(endpoint as '/v1/livechat/visitor/:token', params);
	}

	nextAgent(
		params: OperationParams<'GET', '/v1/livechat/agent.next/:token'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/agent.next/:token'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.get(`/v1/livechat/agent.next/${this.token}`, params);
	}

	async agent(rid: string): Promise<Serialized<OperationResult<'GET', '/v1/livechat/agent.info/:rid/:token'>['agent']>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		const { agent } = await this.rest.get(`/v1/livechat/agent.info/${rid}/${this.token}`);
		return agent;
	}

	message(
		id: string,
		params: OperationParams<'GET', '/v1/livechat/message/:_id'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/message/:_id'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.get(`/v1/livechat/message/${id}`, { ...params, token: this.token });
	}

	async loadMessages(
		rid: string,
		params: OperationParams<'GET', '/v1/livechat/messages.history/:rid'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/messages.history/:rid'>['messages']>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		const { messages } = await this.rest.get(`/v1/livechat/messages.history/${rid}`, { ...params, token: this.token });
		return messages;
	}

	// API POST

	transferChat({
		rid,
		department,
	}: {
		rid: string;
		department: string;
	}): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.transfer'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/room.transfer', { rid, token: this.token, department });
	}

	async grantVisitor(
		guest: OperationParams<'POST', '/v1/livechat/visitor'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor'>>> {
		const result = await this.rest.post('/v1/livechat/visitor', guest);
		this.token = result?.visitor.token;
		return result;
	}

	login(guest: OperationParams<'POST', '/v1/livechat/visitor'>) {
		return this.grantVisitor(guest);
	}

	closeChat({ rid }: { rid: string }): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.close'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/room.close', { rid, token: this.token });
	}

	chatSurvey(
		params: OperationParams<'POST', '/v1/livechat/room.survey'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.survey'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/room.survey', { rid: params.rid, token: this.token, data: params.data });
	}

	updateCallStatus(
		callStatus: string,
		rid: string,
		callId: string,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor.callStatus'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/visitor.callStatus', { token: this.token, callStatus, rid, callId });
	}

	sendMessage(
		params: OperationParams<'POST', '/v1/livechat/message'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/message'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/message', { ...params, token: this.token });
	}

	sendOfflineMessage(
		params: OperationParams<'POST', '/v1/livechat/offline.message'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/offline.message'>>> {
		return this.rest.post('/v1/livechat/offline.message', params);
	}

	sendVisitorNavigation(
		params: OperationParams<'POST', '/v1/livechat/page.visited'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/page.visited'>>> {
		return this.rest.post('/v1/livechat/page.visited', params);
	}

	requestTranscript(email: string, { rid }: { rid: string }): Promise<Serialized<OperationResult<'POST', '/v1/livechat/transcript'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/transcript', { token: this.token, rid, email });
	}

	sendCustomField(
		params: OperationParams<'POST', '/v1/livechat/custom.field'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/custom.field'>>> {
		return this.rest.post('/v1/livechat/custom.field', params);
	}

	sendCustomFields(
		params: OperationParams<'POST', '/v1/livechat/custom.fields'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/custom.fields'>>> {
		return this.rest.post('/v1/livechat/custom.fields', params);
	}

	async updateVisitorStatus(newStatus: string): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor.status'>['status']>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		const { status } = await this.rest.post('/v1/livechat/visitor.status', { token: this.token, status: newStatus });
		return status;
	}

	uploadFile(rid: string, file: File): Promise<ProgressEvent<EventTarget>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}

		if (!file) {
			throw new Error('Invalid file');
		}

		return new Promise((resolve, reject) => {
			if (!this.token) {
				return reject(new Error('Invalid token'));
			}

			return this.rest.upload(
				`/v1/livechat/upload/${rid}`,
				{ file },
				{
					load: resolve,
					error: reject,
				},
				{ headers: { 'x-visitor-token': this.token } },
			);
		});
	}

	// API DELETE

	deleteMessage(id: string, { rid }: { rid: string }): Promise<Serialized<OperationResult<'DELETE', '/v1/livechat/message/:_id'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.delete(`/v1/livechat/message/${id}`, { rid, token: this.token });
	}

	deleteVisitor(): Promise<Serialized<OperationResult<'DELETE', '/v1/livechat/visitor'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.delete(`/v1/livechat/visitor/${this.token}` as any);
	}

	// API PUT

	editMessage(
		id: string,
		params: OperationParams<'PUT', '/v1/livechat/message/:_id'>,
	): Promise<Serialized<OperationResult<'PUT', '/v1/livechat/message/:_id'>>> {
		return this.rest.put(`/v1/livechat/message/${id}`, params);
	}

	static create(url: string, retryOptions = { retryCount: 3, retryTime: 10000 }): LivechatClientImpl {
		// TODO: Decide what to do with the EJSON objects
		const ddp = new DDPDispatcher();

		const connection = ConnectionImpl.create(url, WebSocket, ddp, retryOptions);

		const stream = new ClientStreamImpl(ddp, ddp);

		const account = new AccountImpl(stream);

		const timeoutControl = TimeoutControl.create(ddp, connection);

		const rest = new RestClient({ baseUrl: url.replace(/^ws/, 'http') });

		const sdk = new LivechatClientImpl(connection, stream, account, timeoutControl, rest);

		connection.on('connected', () => {
			Object.entries(stream.subscriptions).forEach(([, sub]) => {
				ddp.subscribeWithId(sub.id, sub.name, sub.params);
			});
		});

		return sdk;
	}
}

import { RestClient } from '@rocket.chat/api-client';
import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { OperationParams, OperationResult } from '@rocket.chat/rest-typings';

import { ClientStreamImpl } from '../ClientStream';
import { ConnectionImpl } from '../Connection';
import { DDPDispatcher } from '../DDPDispatcher';
import { DDPSDK } from '../DDPSDK';
import { TimeoutControl } from '../TimeoutControl';
import { AccountImpl } from '../types/Account';
import type { ClientStream } from '../types/ClientStream';
import type { DDPDispatchOptions } from '../types/DDPClient';
import type { ServerMethodReturn, ServerMethods } from '../types/methods';
import type { StreamKeys, StreamNames, StreamerCallbackArgs } from '../types/streams';
import type { LivechatEndpoints, LivechatRoomEvents, LivechatStream } from './types/LivechatSDK';

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

	private ensureToken(): string {
		if (this.token) return this.token;
	  
		try {
		  const savedToken = localStorage.getItem('rc_livechat_token');
	  
		  if (savedToken) {
			this.token = savedToken;
			return savedToken;
		  }
		} catch (e) {
		  console.warn('Failed to access localStorage', e);
		}
	  
		throw new Error('Invalid token');
	  }

	private ev = new Emitter<{
		userActivity: StreamerCallbackArgs<'notify-room', `${string}/user-activity`>;
		message: StreamerCallbackArgs<'room-messages', string>;
		delete: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>;
	}>();

	subscribeRoom(rid: string) {
		return Promise.all([
			this.onRoomMessage(rid, (...args) => this.ev.emit('message', args)),
			this.onRoomUserActivity(rid, (...args) => this.ev.emit('userActivity', args)),
			this.onRoomDeleteMessage(rid, (...args) => this.ev.emit('delete', args)),
		]);
	}

	onMessage(cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void): () => void {
		return this.ev.on('message', (args) => cb(...args));
	}

	onUserActivity(cb: (username: string, events: string[]) => void): () => void {
		return this.ev.on('userActivity', (args) => args[1] && cb(args[0], args[1]));
	}

	onRoomMessage(rid: string, cb: (...args: StreamerCallbackArgs<'room-messages', string>) => void) {
		const token = this.ensureToken();
		return this.stream('room-messages', [rid, { token, visitorToken: token }], cb).stop;
	}

	onRoomUserActivity(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/user-activity`>) => void) {
		const token = this.ensureToken();
		return this.stream('notify-room', [`${rid}/user-activity`, { token, visitorToken: token }], cb).stop;
	}

	onRoomDeleteMessage(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>) => void) {
		const token = this.ensureToken();
		return this.stream('notify-room', [`${rid}/deleteMessage`, { token, visitorToken: token }], cb).stop;
	}

	onAgentChange(rid: string, cb: (data: LivechatRoomEvents<'agentData'>) => void): () => void {
		const token = this.ensureToken();
		return this.stream('livechat-room', [rid, { token, visitorToken: token }], (data) => {
			if (data.type === 'agentData') {
				cb(data.data);
			}
		}).stop;
	}

	onAgentStatusChange(rid: string, cb: (data: LivechatRoomEvents<'agentStatus'>) => void): () => void {
		const token = this.ensureToken();
		return this.stream('livechat-room', [rid, { token, visitorToken: token }], (data) => {
			if (data.type === 'agentStatus') {
				cb(data.status);
			}
		}).stop;
	}

	onQueuePositionChange(rid: string, cb: (data: LivechatRoomEvents<'queueData' | 'agentData'>) => void): () => void {
		const token = this.ensureToken();

		return this.stream('livechat-room', [rid, {token, visitorToken: token}], (data) => {
			if (data.type === 'queueData') {
				cb(data.data);
			}
		}).stop;
	}

	onVisitorChange(rid: string, cb: (data: LivechatRoomEvents<'visitorData'>) => void): () => void {
		const token = this.ensureToken();
		return this.stream('livechat-room', [rid, { token, visitorToken: token }], (data) => {
			if (data.type === 'visitorData') {
				cb(data.visitor);
			}
		}).stop;
	}

	notifyVisitorActivity(rid: string, username: string, activity: string[]) {
		const token = this.ensureToken();
		return this.client.callAsync('stream-notify-room', `${rid}/user-activity`, username, activity, { token });
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
		const token = this.ensureToken();

		const result = await this.rest.get('/v1/livechat/room', { ...params, token });

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
		const token = this.ensureToken();
		const endpoint = `/v1/livechat/visitor/${token}`;
		return this.rest.get(endpoint as '/v1/livechat/visitor/:token', params);
	}

	nextAgent(
		params: OperationParams<'GET', '/v1/livechat/agent.next/:token'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/agent.next/:token'>>> {
		const token = this.ensureToken();
		return this.rest.get(`/v1/livechat/agent.next/${token}`, params);
	}

	async agent(rid: string): Promise<Serialized<OperationResult<'GET', '/v1/livechat/agent.info/:rid/:token'>['agent']>> {
		const token = this.ensureToken();
		const { agent } = await this.rest.get(`/v1/livechat/agent.info/${rid}/${token}`);
		return agent;
	}

	message(
		id: string,
		params: OperationParams<'GET', '/v1/livechat/message/:_id'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/message/:_id'>>> {
		const token = this.ensureToken();
		return this.rest.get(`/v1/livechat/message/${id}`, { ...params, token });
	}

	async loadMessages(
		rid: string,
		params: OperationParams<'GET', '/v1/livechat/messages.history/:rid'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/messages.history/:rid'>['messages']>> {
		const token = this.ensureToken();
		const { messages } = await this.rest.get(`/v1/livechat/messages.history/${rid}`, { ...params, token });
		return messages;
	}

	// API POST

	transferChat({
		rid,
		department,
	}: {
		rid: string;
		department: string;
	}): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor/department.transfer'>>> {
		const token = this.ensureToken();
		return this.rest.post('/v1/livechat/visitor/department.transfer', { rid, token, department });
	}

	async grantVisitor(
		guest: OperationParams<'POST', '/v1/livechat/visitor'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor'>>> {
		const result = await this.rest.post('/v1/livechat/visitor', guest);
		this.token = result?.visitor.token;
		if(this.token) {
			localStorage.setItem('rc_livechat_token', this.token);
		}
		return result;
	}

	login(guest: OperationParams<'POST', '/v1/livechat/visitor'>) {
		return this.grantVisitor(guest);
	}

	closeChat({ rid }: { rid: string }): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.close'>>> {
		const token = this.ensureToken();
		return this.rest.post('/v1/livechat/room.close', { rid, token });
	}

	chatSurvey(
		params: OperationParams<'POST', '/v1/livechat/room.survey'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.survey'>>> {
		const token = this.ensureToken();
		return this.rest.post('/v1/livechat/room.survey', { rid: params.rid, token, data: params.data });
	}

	sendMessage(
		params: OperationParams<'POST', '/v1/livechat/message'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/message'>>> {
		const token = this.ensureToken();
		return this.rest.post('/v1/livechat/message', { ...params, token });
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
		const token = this.ensureToken();
		return this.rest.post('/v1/livechat/transcript', { token, rid, email });
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
		const token = this.ensureToken();
		const { status } = await this.rest.post('/v1/livechat/visitor.status', { token, status: newStatus });
		return status;
	}

	uploadFile(rid: string, file: File): Promise<ProgressEvent<EventTarget>> {
		
		if (!file) {
			throw new Error('Invalid file');
		}

		return new Promise((resolve, reject) => {
			const token = this.ensureToken();

			return this.rest.upload(
				`/v1/livechat/upload/${rid}`,
				{ file },
				{
					load: resolve,
					error: reject,
				},
				{ headers: { 'x-visitor-token': token } },
			);
		});
	}

	async sendUiInteraction(
		payload: OperationParams<'POST', '/apps/ui.interaction/:id'>,
		appId: string,
	): Promise<Serialized<OperationResult<'POST', '/apps/ui.interaction/:id'>>> {
		const token = this.ensureToken();
		return this.rest.post(`/apps/ui.interaction/${appId}`, payload, { headers: { 'x-visitor-token': token } });
	}

	// API DELETE

	deleteMessage(id: string, { rid }: { rid: string }): Promise<Serialized<OperationResult<'DELETE', '/v1/livechat/message/:_id'>>> {
		const token = this.ensureToken();
		return this.rest.delete(`/v1/livechat/message/${id}`, { rid, token });
	}

	deleteVisitor(): Promise<Serialized<OperationResult<'DELETE', '/v1/livechat/visitor'>>> {
		const token = this.ensureToken();
		return this.rest.delete(`/v1/livechat/visitor/${token}` as any);
	}

	// API PUT

	editMessage(
		id: string,
		params: OperationParams<'PUT', '/v1/livechat/message/:_id'>,
	): Promise<Serialized<OperationResult<'PUT', '/v1/livechat/message/:_id'>>> {
		return this.rest.put(`/v1/livechat/message/${id}`, params);
	}

	unsubscribeAll(): Promise<unknown> {
		const subscriptions = Array.from(this.client.subscriptions.keys());
		return Promise.all(subscriptions.map((subscription) => this.client.unsubscribe(subscription)));
	}

	static override create(url: string, retryOptions = { retryCount: 3, retryTime: 10000 }): LivechatClientImpl {
		// TODO: Decide what to do with the EJSON objects
		const ddp = new DDPDispatcher();

		const connection = ConnectionImpl.create(url, WebSocket, ddp, retryOptions);

		const stream = new ClientStreamImpl(ddp, ddp);

		const account = new AccountImpl(stream);

		const timeoutControl = TimeoutControl.create(ddp, connection);

		const rest = new RestClient({ baseUrl: url.replace(/^ws/, 'http') });

		const sdk = new LivechatClientImpl(connection, stream, account, timeoutControl, rest);

		try {
			const savedToken = localStorage.getItem('rc_livechat_token');
			if (savedToken) {
			  sdk.token = savedToken;
			}
		  } catch (e) {
			console.warn('Failed to restore token', e);
		  }

		connection.on('connected', () => {
			if (!sdk.token) {
				console.warn('Skipping subscription replay: no token');
				return;
			  }
			
			for (const [, sub] of stream.subscriptions.entries()) {
				ddp.subscribeWithId(sub.id, sub.name, sub.params);
			}
		});

		return sdk;
	}
}

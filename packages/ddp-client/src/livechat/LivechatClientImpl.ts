import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { OperationParams, OperationResult } from '@rocket.chat/rest-typings';
import { isValidAppId } from '@rocket.chat/ui-kit';

import { DDPSDK } from '../DDPSDK';
import type { StreamerCallbackArgs } from '../types/streams';
import type { LivechatEndpoints, LivechatRoomEvents, LivechatStream } from './types/LivechatSDK';

export class LivechatClientImpl extends DDPSDK implements LivechatStream, LivechatEndpoints {
	public token?: string;

	/** Another handle on `token`: setting `credentials.token` sets the visitor token the client sends. */
	public readonly credentials: { token?: string } = Object.defineProperty({}, 'token', {
		enumerable: true,
		get: () => this.token,
		set: (token?: string) => {
			this.token = token;
		},
	});

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
		return this.stream('room-messages', [rid, { token: this.token, visitorToken: this.token }], cb).stop;
	}

	onRoomUserActivity(rid: string, cb: (...args: StreamerCallbackArgs<'notify-room', `${string}/user-activity`>) => void) {
		return this.stream('notify-room', [`${rid}/user-activity`, { token: this.token, visitorToken: this.token }], cb).stop;
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
		return this.stream('livechat-room', [rid, { token: this.token, visitorToken: this.token }], (data) => {
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

	notifyVisitorActivity(rid: string, username: string, activity: string[]) {
		return this.client.callAsync('stream-notify-room', `${rid}/user-activity`, username, activity, { token: this.token });
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

	async visitor(
		params: OperationParams<'GET', '/v1/livechat/visitor'>,
	): Promise<Serialized<OperationResult<'GET', '/v1/livechat/visitor'>['visitor']>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		const endpoint = `/v1/livechat/visitor/${this.token}`;
		return this.rest.get(endpoint as '/v1/livechat/visitor/:token', params);
	}

	async nextAgent(
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

	async message(
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

	async transferChat({
		rid,
		department,
	}: {
		rid: string;
		department: string;
	}): Promise<Serialized<OperationResult<'POST', '/v1/livechat/visitor/department.transfer'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/visitor/department.transfer', { rid, token: this.token, department });
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

	async closeChat({ rid }: { rid: string }): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.close'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/room.close', { rid, token: this.token });
	}

	async chatSurvey(
		params: OperationParams<'POST', '/v1/livechat/room.survey'>,
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/room.survey'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.post('/v1/livechat/room.survey', { rid: params.rid, token: this.token, data: params.data });
	}

	async sendMessage(
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

	async requestTranscript(
		email: string,
		{ rid }: { rid: string },
	): Promise<Serialized<OperationResult<'POST', '/v1/livechat/transcript'>>> {
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

	async uploadFile(rid: string, file: File): Promise<ProgressEvent<EventTarget>> {
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

	async sendUiInteraction(
		payload: OperationParams<'POST', '/apps/ui.interaction/:id'>,
		appId: string,
	): Promise<Serialized<OperationResult<'POST', '/apps/ui.interaction/:id'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		if (!isValidAppId(appId)) {
			throw new Error('Invalid app id');
		}
		return this.rest.post(`/apps/ui.interaction/${appId}`, payload, { headers: { 'x-visitor-token': this.token } });
	}

	// API DELETE

	async deleteMessage(id: string, { rid }: { rid: string }): Promise<Serialized<OperationResult<'DELETE', '/v1/livechat/message/:_id'>>> {
		if (!this.token) {
			throw new Error('Invalid token');
		}
		return this.rest.delete(`/v1/livechat/message/${id}`, { rid, token: this.token });
	}

	async deleteVisitor(): Promise<Serialized<OperationResult<'DELETE', '/v1/livechat/visitor'>>> {
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

	unsubscribeAll(): Promise<unknown> {
		const subscriptions = Array.from(this.client.subscriptions.keys());
		return Promise.all(subscriptions.map((subscription) => this.client.unsubscribe(subscription)));
	}

	protected static override defaultOptions = { retryCount: 3, retryTime: 10000 };
}

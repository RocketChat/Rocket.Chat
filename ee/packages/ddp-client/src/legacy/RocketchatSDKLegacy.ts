/* eslint-disable @typescript-eslint/no-this-alias */

import { RestClient } from '@rocket.chat/api-client';
import type { IMessage, Serialized } from '@rocket.chat/core-typings';
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
import type { StreamNames, StreamKeys, StreamerCallbackArgs } from '../types/streams';
import type {
	APILegacy,
	DPPLegacy,
	RocketchatSdkLegacyEvents,
	RocketchatSdkLegacyEventsKeys,
	RocketchatSdkLegacyEventsValues,
} from './types/SDKLegacy';

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

declare module '../types/SDK' {
	interface SDK {
		stream<N extends StreamNames, K extends StreamKeys<N>>(
			streamName: N,
			key: K,
			callback: (...args: StreamerCallbackArgs<N, K>) => void,
		): ReturnType<ClientStream['subscribe']>;
	}
}

interface RocketchatSDKLegacy extends APILegacy, DPPLegacy {}

export class RocketchatSdkLegacyImpl extends DDPSDK implements RocketchatSDKLegacy {
	private ev = new Emitter<RocketchatSdkLegacyEvents>();

	get url(): string {
		return this.connection.url;
	}

	get users() {
		const self = this;
		return {
			all(fields?: { name: 1; username: 1; status: 1; type: 1 }): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>> {
				return self.rest.get('/v1/users.list', { fields: JSON.stringify(fields) });
			},
			allNames(): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>> {
				return self.rest.get('/v1/users.list', { fields: JSON.stringify({ name: 1 }) });
			},
			allIDs(): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>> {
				return self.rest.get('/v1/users.list', { fields: JSON.stringify({ _id: 1 }) });
			},
			online(fields?: { name: 1; username: 1; status: 1; type: 1 }): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>> {
				return self.rest.get('/v1/users.list', { fields: JSON.stringify(fields), query: JSON.stringify({ status: { $ne: 'offline' } }) });
			},
			onlineNames(): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>> {
				return self.rest.get('/v1/users.list', {
					fields: JSON.stringify({ name: 1 }),
					query: JSON.stringify({ status: { $ne: 'offline' } }),
				});
			},
			onlineIds(): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>> {
				return self.rest.get('/v1/users.list', {
					fields: JSON.stringify({ _id: 1 }),
					query: JSON.stringify({ status: { $ne: 'offline' } }),
				});
			},
			info(username: string): Promise<Serialized<OperationResult<'GET', '/v1/users.info'>>> {
				return self.rest.get('/v1/users.info', { username });
			},
		};
	}

	get rooms() {
		const self = this;
		return {
			info: (
				args:
					| {
							roomId: string;
					  }
					| {
							roomName: string;
					  },
			): Promise<Serialized<OperationResult<'GET', '/v1/rooms.info'>>> => {
				return self.rest.get('/v1/rooms.info', args);
			},
			join: (rid: string): Promise<Serialized<OperationResult<'POST', '/v1/channels.join'>>> => {
				return self.rest.post('/v1/channels.join', { roomId: rid });
			},
			load: (rid: string, lastUpdate: Date): Promise<Serialized<OperationResult<'GET', '/v1/chat.syncMessages'>>> => {
				return self.rest.get('/v1/chat.syncMessages', { roomId: rid, lastUpdate: lastUpdate.toISOString() });
			},
			leave: (rid: string): Promise<Serialized<OperationResult<'POST', '/v1/channels.leave'>>> => {
				return self.rest.post('/v1/channels.leave', { roomId: rid });
			},
		};
	}

	joinRoom(args: { rid: string }): Promise<Serialized<OperationResult<'POST', '/v1/channels.join'>>> {
		return this.rest.post('/v1/channels.join', { roomId: args.rid });
	}

	loadHistory(rid: string, lastUpdate: Date): Promise<Serialized<OperationResult<'GET', '/v1/chat.syncMessages'>>> {
		return this.rest.get('/v1/chat.syncMessages', { roomId: rid, lastUpdate: lastUpdate.toISOString() });
	}

	leaveRoom(rid: string): Promise<Serialized<OperationResult<'POST', '/v1/channels.leave'>>> {
		return this.rest.post('/v1/channels.leave', { roomId: rid });
	}

	get dm() {
		const self = this;
		return {
			create(username: string): Promise<Serialized<OperationResult<'POST', '/v1/im.create'>>> {
				return self.rest.post('/v1/im.create', { username });
			},
		};
	}

	channelInfo(args: { roomName: string } | { roomId: string }): Promise<Serialized<OperationResult<'GET', '/v1/channels.info'>>> {
		return this.rest.get('/v1/channels.info', args);
	}

	privateInfo(args: { roomName: string } | { roomId: string }): Promise<Serialized<OperationResult<'GET', '/v1/groups.info'>>> {
		return this.rest.get('/v1/groups.info', args);
	}

	editMessage(args: OperationParams<'POST', '/v1/chat.update'>): Promise<Serialized<OperationResult<'POST', '/v1/chat.update'>>> {
		return this.rest.post('/v1/chat.update', args);
	}

	setReaction(emoji: string, messageId: string): Promise<Serialized<OperationResult<'POST', '/v1/chat.react'>>> {
		return this.rest.post('/v1/chat.react', { emoji, messageId });
	}

	createDirectMessage(username: string): Promise<Serialized<OperationResult<'POST', '/v1/im.create'>>> {
		return this.rest.post('/v1/im.create', { username });
	}

	sendMessage(message: IMessage | string, rid: string): Promise<Serialized<OperationResult<'POST', '/v1/chat.sendMessage'>>> {
		return this.rest.post('/v1/chat.sendMessage', {
			message:
				typeof message === 'string'
					? {
							msg: message,
							rid,
					  }
					: {
							...message,
							rid,
					  },
		});
	}

	resume({ token }: { token: string }): Promise<unknown> {
		return this.account.loginWithToken(token);
	}

	login(credentials: { username: string; password: string }): Promise<unknown> {
		return this.account.loginWithPassword(credentials.username, credentials.password);
	}

	onMessage(cb: (data: any) => void) {
		return this.ev.on('message', cb);
	}

	methodCall(method: string, ...args: any[]) {
		return this.client.callAsync(method, ...args);
	}

	subscribe(topic: string, ...args: any[]) {
		return this.client.subscribe(topic, ...args).ready();
	}

	subscribeRoom(rid: string): Promise<unknown> {
		return Promise.all([
			this.stream('room-messages', rid, (...args) => this.ev.emit('message', args)),
			this.stream('notify-room', `${rid}/typing`, (...args) => this.ev.emit('typing', args)),
			this.stream('notify-room', `${rid}/deleteMessage`, (...args) => this.ev.emit('deleteMessage', args)),
		]);
	}

	subscribeNotifyAll(): Promise<any> {
		return Promise.all([
			// this.stream('notify-all', 'roles-change', (...args) => this.ev.emit('roles-change', args)),
			// this.stream('notify-all', 'updateEmojiCustom', (...args) => this.ev.emit('updateEmojiCustom', args)),
			// this.stream('notify-all', 'deleteEmojiCustom', (...args) => this.ev.emit('deleteEmojiCustom', args)),
			// this.stream('notify-all', 'updateAvatar', (...args) => this.ev.emit('updateAvatar', args)),
			this.stream('notify-all', 'public-settings-changed', (...args) => this.ev.emit('public-settings-changed', args)),
		]);
	}

	subscribeLoggedNotify(): Promise<any> {
		return Promise.all([
			this.stream('notify-logged', 'Users:NameChanged', (...args) => this.ev.emit('Users:NameChanged', args)),
			this.stream('notify-logged', 'Users:Deleted', (...args) => this.ev.emit('Users:Deleted', args)),
			this.stream('notify-logged', 'updateAvatar', (...args) => this.ev.emit('updateAvatar', args)),
			this.stream('notify-logged', 'updateEmojiCustom', (...args) => this.ev.emit('updateEmojiCustom', args)),
			this.stream('notify-logged', 'deleteEmojiCustom', (...args) => this.ev.emit('deleteEmojiCustom', args)),
			this.stream('notify-logged', 'roles-change', (...args) => this.ev.emit('roles-change', args)),
			this.stream('notify-logged', 'permissions-changed', (...args) => this.ev.emit('permissions-changed', args)),
		]);
	}

	subscribeNotifyUser = (): Promise<any> => {
		return Promise.all([
			this.stream('notify-user', `${this.account.uid}/message`, (...args) => this.ev.emit('user-message', args)),
			this.stream('notify-user', `${this.account.uid}/otr`, (...args) => this.ev.emit('otr', args)),
			this.stream('notify-user', `${this.account.uid}/webrtc`, (...args) => this.ev.emit('webrtc', args)),
			this.stream('notify-user', `${this.account.uid}/notification`, (...args) => this.ev.emit('notification', args)),
			this.stream('notify-user', `${this.account.uid}/rooms-changed`, (...args) => this.ev.emit('rooms-changed', args)),
			this.stream('notify-user', `${this.account.uid}/subscriptions-changed`, (...args) => this.ev.emit('subscriptions-changed', args)),
			this.stream('notify-user', `${this.account.uid}/uiInteraction`, (...args) => this.ev.emit('uiInteraction', args)),
		]);
	};

	onStreamData<E extends RocketchatSdkLegacyEventsKeys>(event: E, cb: (...data: RocketchatSdkLegacyEventsValues<E>) => void): () => void {
		return this.ev.on(event, cb as any);
	}

	async disconnect(): Promise<unknown> {
		return this.connection.close();
	}

	connect(_options: { useSsl: boolean; host: string; port: number }) {
		return this.connection.connect();
	}

	unsubscribe(subscription: string): Promise<unknown> {
		return this.client.unsubscribe(subscription);
	}

	unsubscribeAll(): Promise<unknown> {
		return Promise.all(Object.entries(this.client.subscriptions).map(([, subscription]) => this.client.unsubscribe(subscription)));
	}

	static create(url: string, retryOptions = { retryCount: 1, retryTime: 100 }): RocketchatSdkLegacyImpl {
		const ddp = new DDPDispatcher();

		const connection = ConnectionImpl.create(url, WebSocket, ddp, retryOptions);

		const stream = new ClientStreamImpl(ddp, ddp);

		const account = new AccountImpl(stream);

		const timeoutControl = TimeoutControl.create(ddp, connection);

		const rest = new (class RestApiClient extends RestClient {
			getCredentials() {
				if (!account.uid || !account.user?.token) {
					return;
				}
				return {
					'X-User-Id': account.uid,
					'X-Auth-Token': account.user?.token,
				};
			}
		})({ baseUrl: url });

		const sdk = new RocketchatSdkLegacyImpl(connection, stream, account, timeoutControl, rest);

		connection.on('connected', () => {
			Object.entries(stream.subscriptions).forEach(([, sub]) => {
				ddp.subscribeWithId(sub.id, sub.name, sub.params);
			});
		});

		return sdk;
	}
}

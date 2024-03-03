import type { IMessage, Serialized } from '@rocket.chat/core-typings';
import type { OperationParams, OperationResult } from '@rocket.chat/rest-typings';

import type { StreamerCallbackArgs } from '../../types/streams';

export interface APILegacy {
	users: {
		all(fields?: { name: 1; username: 1; status: 1; type: 1 }): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>>;
		allNames(): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>>;
		allIDs(): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>>;
		online(fields?: { name: 1; username: 1; status: 1; type: 1 }): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>>;
		onlineNames(): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>>;
		onlineIds(): Promise<Serialized<OperationResult<'GET', '/v1/users.list'>>>;
		info(username: string): Promise<Serialized<OperationResult<'GET', '/v1/users.info'>>>;
	};

	rooms: {
		info(args: { roomName: string } | { roomId: string }): Promise<Serialized<OperationResult<'GET', '/v1/rooms.info'>>>;
		join(rid: string): Promise<Serialized<OperationResult<'POST', '/v1/channels.join'>>>;
		load(rid: string, lastUpdate: Date): Promise<Serialized<OperationResult<'GET', '/v1/chat.syncMessages'>>>;
		leave(rid: string): Promise<Serialized<OperationResult<'POST', '/v1/channels.leave'>>>;
	};

	joinRoom(args: { rid: string }): Promise<Serialized<OperationResult<'POST', '/v1/channels.join'>>>;
	loadHistory(rid: string, lastUpdate: Date): Promise<Serialized<OperationResult<'GET', '/v1/chat.syncMessages'>>>;
	leaveRoom(rid: string): Promise<Serialized<OperationResult<'POST', '/v1/channels.leave'>>>;

	dm: {
		create(username: string): Promise<Serialized<OperationResult<'POST', '/v1/im.create'>>>;
	};

	createDirectMessage(username: string): Promise<Serialized<OperationResult<'POST', '/v1/im.create'>>>;

	sendMessage(message: IMessage | string, rid: string): Promise<Serialized<OperationResult<'POST', '/v1/chat.sendMessage'>>>;

	// getRoomIdByNameOrId(name: string): Promise<Serialized<OperationResult<'GET', '/v1/chat.getRoomIdByNameOrId'>>>;

	// getRoomNameById(rid: string): Promise<Serialized<OperationResult<'GET', '/v1/chat.getRoomNameById'>>>;

	// getRoomName(rid: string): Promise<Serialized<OperationResult<'GET', '/v1/chat.getRoomNameById'>>>;

	// getRoomId(name: string): Promise<Serialized<OperationResult<'GET', '/v1/chat.find'>>>;

	editMessage(args: OperationParams<'POST', '/v1/chat.update'>): Promise<Serialized<OperationResult<'POST', '/v1/chat.update'>>>;

	setReaction(emoji: string, messageId: string): Promise<Serialized<OperationResult<'POST', '/v1/chat.react'>>>;

	channelInfo(args: { roomName: string } | { roomId: string }): Promise<Serialized<OperationResult<'GET', '/v1/channels.info'>>>;

	privateInfo(args: { roomName: string } | { roomId: string }): Promise<Serialized<OperationResult<'GET', '/v1/groups.info'>>>;
}

export interface DPPLegacy {
	resume({ token }: { token: string }): Promise<unknown>;
	login(credentials: { username: string; password: string }): Promise<unknown>;
	connect(options: { useSsl: boolean; host: string; port: number }): Promise<unknown>;

	disconnect(): Promise<unknown>;

	onStreamData<E extends RocketchatSdkLegacyEventsKeys>(event: E, cb: (...data: RocketchatSdkLegacyEventsValues<E>) => void): () => void;

	subscribe(topic: string, ...args: any[]): Promise<unknown>;
	unsubscribe(subscription: unknown): Promise<unknown>;
	unsubscribeAll(): Promise<unknown>;

	subscribeRoom(rid: string, ...args: any[]): Promise<unknown>;
	subscribeNotifyAll(): Promise<unknown>;
	subscribeLoggedNotify(): Promise<unknown>;
	subscribeNotifyUser(): Promise<unknown>;

	url: string;

	onMessage(cb: (data: any) => void): () => void;
	methodCall(method: string, ...args: any[]): Promise<unknown>;
}

export type RocketchatSdkLegacyEvents = {
	'message': StreamerCallbackArgs<'room-messages', string>;
	'typing': StreamerCallbackArgs<'notify-room', `${string}/typing`>;
	'deleteMessage': StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>;
	'roles-change': StreamerCallbackArgs<'notify-logged', 'roles-change'>;
	'updateEmojiCustom': StreamerCallbackArgs<'notify-logged', 'updateEmojiCustom'>;
	'deleteEmojiCustom': StreamerCallbackArgs<'notify-logged', 'deleteEmojiCustom'>;
	'public-settings-changed': StreamerCallbackArgs<'notify-all', 'public-settings-changed'>;
	'permissions-changed': StreamerCallbackArgs<'notify-logged', 'permissions-changed'>;
	'Users:NameChanged': StreamerCallbackArgs<'notify-logged', 'Users:NameChanged'>;
	'Users:Deleted': StreamerCallbackArgs<'notify-logged', 'Users:Deleted'>;
	'updateAvatar': StreamerCallbackArgs<'notify-logged', 'updateAvatar'>;

	'user-message': StreamerCallbackArgs<'notify-user', `${string}/message`>;
	'otr': StreamerCallbackArgs<'notify-user', `${string}/otr`>;
	'webrtc': StreamerCallbackArgs<'notify-user', `${string}/webrtc`>;
	'notification': StreamerCallbackArgs<'notify-user', `${string}/notification`>;
	'rooms-changed': StreamerCallbackArgs<'notify-user', `${string}/rooms-changed`>;
	'subscriptions-changed': StreamerCallbackArgs<'notify-user', `${string}/subscriptions-changed`>;
	'mentions': StreamerCallbackArgs<'notify-user', `${string}/mentions`>; // SUBSCRIPTIONS_FLAG
	'uiInteraction': StreamerCallbackArgs<'notify-user', `${string}/uiInteraction`>;
};

export type RocketchatSdkLegacyEventsKeys = keyof RocketchatSdkLegacyEvents;

export type RocketchatSdkLegacyEventsValues<E extends RocketchatSdkLegacyEventsKeys> = RocketchatSdkLegacyEvents[E];

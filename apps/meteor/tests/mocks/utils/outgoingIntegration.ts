import type { IIntegrationHistory, IMessage, IOutgoingIntegration, IRoom, IUser } from '@rocket.chat/core-typings';

export const makeIntegration = (overrides: Partial<IOutgoingIntegration> = {}): IOutgoingIntegration =>
	({
		_id: 'integration-1',
		type: 'webhook-outgoing',
		event: 'sendMessage',
		enabled: true,
		name: 'My Integration',
		username: 'rocket.cat',
		urls: ['https://hooks.example/one'],
		token: 'integration-token',
		channel: [],
		...overrides,
	}) as IOutgoingIntegration;

export const makeRoom = (overrides: Partial<IRoom> = {}): IRoom =>
	({
		_id: 'room-1',
		t: 'c',
		name: 'general',
		ts: new Date('2024-01-01T00:00:00.000Z'),
		_updatedAt: new Date('2024-01-01T00:00:00.000Z'),
		msgs: 0,
		usersCount: 1,
		u: { _id: 'owner-1', username: 'owner' },
		...overrides,
	}) as IRoom;

export const makeMessage = (overrides: Partial<IMessage & { editedAt?: Date }> = {}): IMessage & { editedAt?: Date } =>
	({
		_id: 'message-1',
		rid: 'room-1',
		msg: 'hello world',
		ts: new Date('2024-01-02T00:00:00.000Z'),
		_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
		u: { _id: 'user-1', username: 'sender' },
		...overrides,
	}) as IMessage & { editedAt?: Date };

export const makeUser = (overrides: Partial<IUser> = {}): IUser =>
	({
		_id: 'user-1',
		username: 'sender',
		name: 'Sender',
		createdAt: new Date('2023-01-01T00:00:00.000Z'),
		_updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		roles: ['user'],
		active: true,
		type: 'user',
		...overrides,
	}) as IUser;

export const makeHistory = (overrides: Partial<IIntegrationHistory> = {}): IIntegrationHistory =>
	({
		_id: 'history-9',
		type: 'outgoing-webhook',
		step: 'after-http-call',
		event: 'sendMessage',
		url: 'https://hooks.example/replayed',
		data: { channel_id: 'room-1', message_id: 'message-1', user_id: 'user-1', owner: { _id: 'owner-9' } },
		...overrides,
	}) as IIntegrationHistory;

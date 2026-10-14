import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module('./SDKClient', {
	exports: {
		sdk: {
			rest: {
				get: fn<FunctionLike>(),
			},
		},
	},
});
mock.module('./getUserPreference', {
	exports: {
		getUserPreference: fn<FunctionLike>(() => false),
	},
});
mock.module('./onClientMessageReceived', {
	exports: {
		onClientMessageReceived: fn<FunctionLike>((message) => message),
	},
});
mock.module('./toast', {
	exports: {
		dispatchToastMessage: fn<FunctionLike>(),
	},
});
mock.module('./user', {
	exports: {
		getUserId: fn<FunctionLike>(() => 'user-id'),
	},
});
mock.module('./utils/getConfig', {
	exports: {
		getConfig: fn<FunctionLike>(() => undefined),
	},
});
mock.module('../stores', {
	exports: {
		Messages: {
			state: {
				store: fn<FunctionLike>(),
				storeMany: fn<FunctionLike>(),
				findFirst: fn<FunctionLike>(),
				remove: fn<FunctionLike>(),
				some: fn<FunctionLike>(),
			},
		},

		Subscriptions: {
			state: {
				find: fn<FunctionLike>(),
			},
		},
	},
});
const { RoomHistoryManager }: typeof import('./RoomHistoryManager') = require('./RoomHistoryManager');
const { sdk }: typeof import('./SDKClient') = require('./SDKClient');
const { Messages }: typeof import('../stores') = require('../stores');

const mockedGet = mocked(sdk.rest.get);

const createMessage = (rid: string, _id: string) => ({
	_id,
	rid,
	msg: 'hello',
	ts: '2026-01-01T00:00:00.000Z',
	_updatedAt: '2026-01-01T00:00:00.000Z',
	u: { _id: 'user-id', username: 'user' },
});

describe('RoomHistoryManager', () => {
	const originalRandomUUID = globalThis.crypto.randomUUID;

	beforeEach(() => {
		Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: undefined });
		mockedGet.mockImplementation((async (_endpoint: string, { roomId }: { roomId: string }) => ({
			messages: [createMessage(roomId, `${roomId}-message`)],
			cursor: { previous: null },
			unreadNotLoaded: 0,
		})) as never);
	});

	afterEach(() => {
		Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: originalRandomUUID });
		RoomHistoryManager.close('room-a');
		RoomHistoryManager.close('room-b');
		mocker.clearAllMocks();
	});

	it('loads history when crypto.randomUUID is unavailable', async () => {
		await expect(RoomHistoryManager.getMore('room-a')).resolves.toBeUndefined();

		expect(mockedGet).toHaveBeenCalledWith('/v1/rooms.history', { roomId: 'room-a', count: 50, showThreadMessages: false });
		expect(Messages.state.storeMany).toHaveBeenCalledWith([expect.objectContaining({ _id: 'room-a-message', rid: 'room-a' })]);
		expect(RoomHistoryManager.isLoading('room-a')).toBe(false);
	});

	it('completes concurrent requests when crypto.randomUUID is unavailable', async () => {
		await expect(Promise.all([RoomHistoryManager.getMore('room-a'), RoomHistoryManager.getMore('room-b')])).resolves.toEqual([
			undefined,
			undefined,
		]);

		expect(mockedGet).toHaveBeenCalledTimes(2);
		expect(Messages.state.storeMany).toHaveBeenCalledWith([expect.objectContaining({ _id: 'room-b-message', rid: 'room-b' })]);
		expect(RoomHistoryManager.isLoading('room-a')).toBe(false);
		expect(RoomHistoryManager.isLoading('room-b')).toBe(false);
	});
});

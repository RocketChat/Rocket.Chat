import { RoomHistoryManager } from './RoomHistoryManager';
import { sdk } from './SDKClient';
import { Messages } from '../stores';

jest.mock('./SDKClient', () => ({
	sdk: {
		rest: {
			get: jest.fn(),
		},
	},
}));

jest.mock('./getUserPreference', () => ({
	getUserPreference: jest.fn(() => false),
}));

jest.mock('./onClientMessageReceived', () => ({
	onClientMessageReceived: jest.fn((message) => message),
}));

jest.mock('./toast', () => ({
	dispatchToastMessage: jest.fn(),
}));

jest.mock('./user', () => ({
	getUserId: jest.fn(() => 'user-id'),
}));

jest.mock('./utils/getConfig', () => ({
	getConfig: jest.fn(() => undefined),
}));

jest.mock('../stores', () => ({
	Messages: {
		state: {
			store: jest.fn(),
			storeMany: jest.fn(),
			findFirst: jest.fn(),
			remove: jest.fn(),
			some: jest.fn(),
		},
	},
	Subscriptions: {
		state: {
			find: jest.fn(),
		},
	},
}));

const mockedGet = jest.mocked(sdk.rest.get);

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
		jest.clearAllMocks();
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

import { callWithErrorHandling } from './utils/callWithErrorHandling';
import { RoomHistoryManager } from '../../app/ui-utils/client/lib/RoomHistoryManager';

jest.mock('./onClientMessageReceived', () => ({
	onClientMessageReceived: jest.fn((message) => message),
}));

jest.mock('./user', () => ({
	getUserId: jest.fn(() => 'user-id'),
}));

jest.mock('./utils/callWithErrorHandling', () => ({
	callWithErrorHandling: jest.fn(),
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

jest.mock('../../app/utils/client', () => ({
	getUserPreference: jest.fn(() => false),
}));

const mockedCallWithErrorHandling = jest.mocked(callWithErrorHandling);

describe('RoomHistoryManager', () => {
	it('loads history when crypto.randomUUID is unavailable', async () => {
		const originalRandomUUID = globalThis.crypto.randomUUID;
		Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: undefined });
		mockedCallWithErrorHandling.mockResolvedValue({ messages: [], unreadNotLoaded: 0 } as never);

		try {
			await expect(RoomHistoryManager.getMore('room-id')).resolves.toBeUndefined();
			expect(mockedCallWithErrorHandling).toHaveBeenCalledWith('loadHistory', 'room-id', undefined, 50, undefined, false);
		} finally {
			Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: originalRandomUUID });
			RoomHistoryManager.close('room-id');
		}
	});
});

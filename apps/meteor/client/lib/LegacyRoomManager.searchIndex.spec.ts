import { LegacyRoomManager } from './LegacyRoomManager';
import { Messages } from '../stores';
import { roomMessageDeletes } from './e2eeSearch/roomMessageDeletes';

const mockHandlers = new Map<string, (params: Record<string, unknown>) => unknown>();
jest.mock('./SDKClient', () => ({
	sdk: {
		stream: (_name: string, [event]: string[], handler: (params: Record<string, unknown>) => unknown) => {
			mockHandlers.set(event, handler);
			return { stop: jest.fn(), ready: () => Promise.resolve() };
		},
	},
}));
jest.mock('./RoomManager', () => ({ RoomManager: { close: jest.fn() } }));
jest.mock('./RoomHistoryManager', () => ({ upsertMessage: jest.fn(), RoomHistoryManager: { close: jest.fn() } }));
jest.mock('./rooms/roomCoordinator', () => ({
	roomCoordinator: { getRoomDirectives: () => ({ findRoom: () => ({ _id: 'r', name: 'room' }) }) },
}));
jest.mock('./utils/getConfig', () => ({ getConfig: () => undefined }));
jest.mock('./utils/fireGlobalEvent', () => ({ fireGlobalEvent: jest.fn() }));
jest.mock('./utils/modifyMessageOnFilesDelete', () => ({ modifyMessageOnFilesDelete: (record: unknown) => record }));
jest.mock('@rocket.chat/ui-client', () => ({ clientCallbacks: { run: jest.fn() } }));
jest.mock('../stores', () => ({
	Messages: { state: { delete: jest.fn(), update: jest.fn(), remove: jest.fn() } },
	Subscriptions: { state: { find: jest.fn() } },
}));

afterEach(async () => {
	await LegacyRoomManager.closeAllRooms();
	mockHandlers.clear();
	jest.clearAllMocks();
});

describe('room deletion search notifications', () => {
	it('publishes a single deletion after removing the message and thread references', async () => {
		LegacyRoomManager.open({ typeName: 'croom', rid: 'r' });
		const listener = jest.fn(() => {
			expect(Messages.state.delete).toHaveBeenCalledWith('m');
			expect(Messages.state.update).toHaveBeenCalled();
		});
		const off = roomMessageDeletes.on('deleteMessage', listener);
		try {
			await mockHandlers.get('r/deleteMessage')!({ _id: 'm' });
			expect(listener).toHaveBeenCalledWith({ _id: 'm' });
		} finally {
			off();
		}
	});

	it.each([{ filesOnly: true }, { showDeletedStatus: true }, {}])('publishes bulk deletion after the store mutation: %p', async (flags) => {
		LegacyRoomManager.open({ typeName: 'croom', rid: 'r' });
		const params = { rid: 'r', ids: ['m'], ...flags };
		const listener = jest.fn(() => {
			if ('filesOnly' in flags || 'showDeletedStatus' in flags) expect(Messages.state.update).toHaveBeenCalled();
			else expect(Messages.state.remove).toHaveBeenCalled();
		});
		const off = roomMessageDeletes.on('deleteMessageBulk', listener);
		try {
			await mockHandlers.get('r/deleteMessageBulk')!(params);
			expect(listener).toHaveBeenCalledWith(params);
		} finally {
			off();
		}
	});
});

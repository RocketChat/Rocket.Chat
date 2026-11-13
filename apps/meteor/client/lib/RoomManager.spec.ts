import type { MessageListPosition } from '@rocket.chat/ui-message-list';

import { RoomManager } from './RoomManager';

jest.mock('./RoomHistoryManager', () => ({ RoomHistoryManager: {} }));

const position: MessageListPosition = {
	isAtBottom: false,
	anchorMessageId: 'message-id',
	offsetWithinAnchor: 12,
	cacheKeys: { first: 'message-id', last: 'message-id', length: 1 },
	width: 600,
};

afterEach(() => {
	RoomManager.close('room-a');
	RoomManager.close('room-b');
});

it('keeps the position of a room while the session lasts, apart from the other rooms (R16)', () => {
	RoomManager.open('room-a');
	expect(RoomManager.getStore('room-a')?.position).toBeUndefined();

	RoomManager.getStore('room-a')?.savePosition(position);
	RoomManager.open('room-b');
	RoomManager.open('room-a');

	expect(RoomManager.getStore('room-a')?.position).toBe(position);
	expect(RoomManager.getStore('room-b')?.position).toBeUndefined();
});

it('forgets the position of a room that is closed (R16)', () => {
	RoomManager.open('room-a');
	RoomManager.getStore('room-a')?.savePosition(position);

	RoomManager.close('room-a');
	RoomManager.open('room-a');

	expect(RoomManager.getStore('room-a')?.position).toBeUndefined();
});

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
	RoomManager.back('room-a');
	RoomManager.back('room-b');
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

	RoomManager.back('room-a');
	RoomManager.close('room-a');
	expect(RoomManager.getStore('room-a')).toBeUndefined();
	RoomManager.open('room-a');

	expect(RoomManager.getStore('room-a')).toBeDefined();
	expect(RoomManager.getStore('room-a')?.position).toBeUndefined();
});

it('keeps nothing else about the scroll of a room than where its list was left (R16)', () => {
	RoomManager.open('room-a');
	const store = RoomManager.getStore('room-a');
	store?.savePosition(position);

	expect(store).toHaveProperty('position', position);
	['scroll', 'atBottom', 'cache', 'cacheMessageCount', 'lastTime', 'lm', 'update'].forEach((old) => expect(store).not.toHaveProperty(old));
});

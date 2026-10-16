import type { IRoom } from '@rocket.chat/core-typings';

import { canAccessRoomAsync } from './canAccessRoom';
import { validateRoomMessagePermissionsAsync } from './canSendMessage';
import { hasPermissionAsync } from './hasPermission';

jest.mock('@rocket.chat/models', () => ({
	Subscriptions: {
		findOneByRoomIdAndUserId: jest.fn().mockResolvedValue(null),
	},
	Rooms: {
		findOneById: jest.fn(),
	},
	Messages: {
		findOneById: jest.fn().mockImplementation((id: string) => {
			if (id === 'thread-msg-1') {
				return Promise.resolve({ _id: 'thread-msg-1', rid: 'r1' });
			}
			if (id === 'thread-msg-other-room') {
				return Promise.resolve({ _id: 'thread-msg-other-room', rid: 'r2' });
			}
			return Promise.resolve(null);
		}),
	},
}));

jest.mock('./canAccessRoom', () => ({
	canAccessRoomAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('./hasPermission', () => ({
	hasPermissionAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock('../rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: jest.fn().mockReturnValue({
			allowMemberAction: jest.fn().mockResolvedValue(false),
		}),
	},
}));

describe('validateRoomMessagePermissionsAsync', () => {
	const user = { uid: 'u1', username: 'testuser', type: 'user' as const };

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(canAccessRoomAsync).mockResolvedValue(true);
		jest.mocked(hasPermissionAsync).mockResolvedValue(false);
	});

	it('should throw when room is null', async () => {
		await expect(validateRoomMessagePermissionsAsync(null, user)).rejects.toThrow('error-invalid-room');
	});

	it('should throw when room is archived', async () => {
		const room = { _id: 'r1', t: 'c', archived: true } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user)).rejects.toThrow('room_is_archived');
	});

	it('should throw when user cannot access room', async () => {
		jest.mocked(canAccessRoomAsync).mockResolvedValue(false);
		const room = { _id: 'r1', t: 'c' } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user)).rejects.toThrow('error-not-allowed');
	});

	it('should throw for regular message when room is read-only and user lacks permission', async () => {
		const room = { _id: 'r1', t: 'c', ro: true } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user)).rejects.toThrow("You can't send messages because the room is readonly.");
	});

	it('should allow regular message when user has post-readonly permission', async () => {
		jest.mocked(hasPermissionAsync).mockResolvedValue(true);
		const room = { _id: 'r1', t: 'c', ro: true } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user)).resolves.toBeUndefined();
	});

	it('should allow thread reply when room is read-only and replyWhenReadOnly is enabled', async () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: true } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user, { tmid: 'thread-msg-1', tshow: false })).resolves.toBeUndefined();
	});

	it('should disallow thread reply when replyWhenReadOnly is enabled but tshow is true', async () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: true } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user, { tmid: 'thread-msg-1', tshow: true })).rejects.toThrow(
			"You can't send messages because the room is readonly.",
		);
	});

	it('should disallow thread reply when thread parent message does not exist', async () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: true } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user, { tmid: 'nonexistent-msg', tshow: false })).rejects.toThrow(
			"You can't send messages because the room is readonly.",
		);
	});

	it('should disallow thread reply when thread parent message belongs to another room', async () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: true } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user, { tmid: 'thread-msg-other-room', tshow: false })).rejects.toThrow(
			"You can't send messages because the room is readonly.",
		);
	});

	it('should disallow thread reply when room is read-only and replyWhenReadOnly is false', async () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: false } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user, { tmid: 'thread-msg-1' })).rejects.toThrow(
			"You can't send messages because the room is readonly.",
		);
	});

	it('should throw when user is muted even if thread reply in replyWhenReadOnly room', async () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: true, muted: ['testuser'] } as unknown as IRoom;
		await expect(validateRoomMessagePermissionsAsync(room, user, { tmid: 'thread-msg-1' })).rejects.toThrow('You_have_been_muted');
	});
});

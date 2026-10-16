import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useMessageComposerIsReadOnly } from './useMessageComposerIsReadOnly';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		readOnly: jest.fn(),
	},
}));

describe('useMessageComposerIsReadOnly', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(roomCoordinator.readOnly).mockImplementation((room) => Boolean(room?.ro));
	});

	it('should not force read-only if room is archived and not read-only', () => {
		const room = { _id: 'r1', t: 'c', archived: true } as unknown as IRoom;
		const wrapper = mockAppRoot().withJohnDoe().build();

		const { result } = renderHook(() => useMessageComposerIsReadOnly(room), { wrapper });
		expect(result.current).toBe(false);
	});

	it('should return true if user is muted in room', () => {
		const room = { _id: 'r1', t: 'c', muted: ['john.doe'] } as unknown as IRoom;
		const wrapper = mockAppRoot().withJohnDoe().build();

		const { result } = renderHook(() => useMessageComposerIsReadOnly(room), { wrapper });
		expect(result.current).toBe(true);
	});

	it('should return true if room is read-only and user lacks post-readonly permission', () => {
		const room = { _id: 'r1', t: 'c', ro: true } as unknown as IRoom;
		const wrapper = mockAppRoot().withJohnDoe().build();

		const { result } = renderHook(() => useMessageComposerIsReadOnly(room), { wrapper });
		expect(result.current).toBe(true);
	});

	it('should return false if room is read-only but user has post-readonly permission', () => {
		jest.mocked(roomCoordinator.readOnly).mockReturnValue(false);
		const room = { _id: 'r1', t: 'c', ro: true } as unknown as IRoom;
		const wrapper = mockAppRoot().withJohnDoe().withPermission('post-readonly').build();

		const { result } = renderHook(() => useMessageComposerIsReadOnly(room), { wrapper });
		expect(result.current).toBe(false);
	});

	it('should return false for thread replies when room is read-only and replyWhenReadOnly is true', () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: true } as unknown as IRoom;
		const wrapper = mockAppRoot().withJohnDoe().build();

		const { result } = renderHook(() => useMessageComposerIsReadOnly(room, { tmid: 'tmid1' }), { wrapper });
		expect(result.current).toBe(false);
	});

	it('should return true for main room composer when room is read-only even if replyWhenReadOnly is true', () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: true } as unknown as IRoom;
		const wrapper = mockAppRoot().withJohnDoe().build();

		const { result } = renderHook(() => useMessageComposerIsReadOnly(room), { wrapper });
		expect(result.current).toBe(true);
	});

	it('should return true for thread replies when room is read-only and replyWhenReadOnly is false', () => {
		const room = { _id: 'r1', t: 'c', ro: true, replyWhenReadOnly: false } as unknown as IRoom;
		const wrapper = mockAppRoot().withJohnDoe().build();

		const { result } = renderHook(() => useMessageComposerIsReadOnly(room, { tmid: 'tmid1' }), { wrapper });
		expect(result.current).toBe(true);
	});
});

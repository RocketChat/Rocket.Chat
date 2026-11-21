import type { ISubscription } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useThreadFirstUnreadMessageId } from './useThreadFirstUnreadMessageId';
import { createFakeMessage } from '../../../../../../tests/mocks/data';

let subscription: Partial<ISubscription> | undefined;

jest.mock('../../../contexts/RoomContext', () => ({
	useRoomSubscription: () => subscription,
}));

const reply = (_id: string, minute: number, userId = 'other.user', tmid = 'thread-id') =>
	createFakeMessage({ _id, tmid, ts: new Date(Date.UTC(2026, 0, 1, 10, minute)), u: { _id: userId, username: userId } });

const messages = [reply('r1', 0), reply('r2', 5), reply('own', 10, 'john.doe'), reply('r3', 12), reply('r4', 15)];

describe('useThreadFirstUnreadMessageId', () => {
	it('marks the first reply from another user sent at or after the first unread time', () => {
		subscription = { tunreadSince: { 'thread-id': new Date(Date.UTC(2026, 0, 1, 10, 10)) } };

		const { result } = renderHook(() => useThreadFirstUnreadMessageId('thread-id', messages), {
			wrapper: mockAppRoot().withJohnDoe().build(),
		});

		expect(result.current).toBe('r3');
	});

	it('keeps the mark after reading the thread clears the time from the subscription', () => {
		subscription = { tunreadSince: { 'thread-id': new Date(Date.UTC(2026, 0, 1, 10, 12)) } };

		const { result, rerender } = renderHook(() => useThreadFirstUnreadMessageId('thread-id', messages), {
			wrapper: mockAppRoot().withJohnDoe().build(),
		});
		subscription = { tunreadSince: {} };
		rerender();

		expect(result.current).toBe('r3');
	});

	it('marks the first unread reply of the other thread after switching threads', () => {
		subscription = {
			tunreadSince: { 'thread-id': new Date(Date.UTC(2026, 0, 1, 10, 12)), 'other-thread': new Date(Date.UTC(2026, 0, 1, 10, 7)) },
		};
		const otherMessages = [reply('o1', 3, 'other.user', 'other-thread'), reply('o2', 7, 'other.user', 'other-thread')];

		const { result, rerender } = renderHook(({ tmid, list }) => useThreadFirstUnreadMessageId(tmid, list), {
			initialProps: { tmid: 'thread-id', list: messages },
			wrapper: mockAppRoot().withJohnDoe().build(),
		});
		expect(result.current).toBe('r3');

		rerender({ tmid: 'other-thread', list: otherMessages });

		expect(result.current).toBe('o2');
	});

	it('removes the mark once the user replies after it', () => {
		subscription = { tunreadSince: { 'thread-id': new Date(Date.UTC(2026, 0, 1, 10, 12)) } };

		const { result, rerender } = renderHook(({ list }) => useThreadFirstUnreadMessageId('thread-id', list), {
			initialProps: { list: messages },
			wrapper: mockAppRoot().withJohnDoe().build(),
		});
		rerender({ list: [...messages, reply('answer', 20, 'john.doe')] });

		expect(result.current).toBeUndefined();
	});

	it('marks nothing when the thread has no unread replies', () => {
		subscription = {};

		const { result } = renderHook(() => useThreadFirstUnreadMessageId('thread-id', messages), {
			wrapper: mockAppRoot().withJohnDoe().build(),
		});

		expect(result.current).toBeUndefined();
	});
});

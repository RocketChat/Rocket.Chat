import { act, renderHook } from '@testing-library/react';

import { useIsCollapsibleToggled } from './useIsCollapsibleToggled';
import { RoomManager } from '../../../lib/RoomManager';
import { MAX_TOGGLED_COLLAPSIBLES_PER_ROOM } from '../../../lib/constants';

jest.mock('../../../../client/lib/RoomHistoryManager', () => ({
	RoomHistoryManager: {},
}));

it('should not be toggled by default', () => {
	RoomManager.open('room-a');
	const { result } = renderHook(() => useIsCollapsibleToggled('key-a'));
	expect(result.current).toBe(false);
});

it('should reflect an already-toggled key in the opened room store', () => {
	RoomManager.open('room-b');
	RoomManager.getStore('room-b')?.toggleCollapsible('key-b');

	const { result } = renderHook(() => useIsCollapsibleToggled('key-b'));
	expect(result.current).toBe(true);
});

it('should re-render when the store toggles after mount', () => {
	RoomManager.open('room-c');
	const { result } = renderHook(() => useIsCollapsibleToggled('key-c'));
	expect(result.current).toBe(false);

	act(() => {
		RoomManager.getStore('room-c')?.toggleCollapsible('key-c');
	});
	expect(result.current).toBe(true);
});

it('should not leak a toggle to a different key in the same room', () => {
	RoomManager.open('room-d');
	RoomManager.getStore('room-d')?.toggleCollapsible('key-d1');

	const { result } = renderHook(() => useIsCollapsibleToggled('key-d2'));
	expect(result.current).toBe(false);
});

it('should be a no-op when there is no key', () => {
	RoomManager.open('room-e');
	const { result } = renderHook(() => useIsCollapsibleToggled(undefined));
	expect(result.current).toBe(false);
});

it('should be a no-op when there is no opened room', () => {
	const currentlyOpened = RoomManager.opened;
	if (currentlyOpened) {
		RoomManager.back(currentlyOpened);
	}

	const { result } = renderHook(() => useIsCollapsibleToggled('key-f'));
	expect(result.current).toBe(false);
});

it('should evict the oldest toggle once a room store is full, keeping it bounded', () => {
	RoomManager.open('room-bound');
	const store = RoomManager.getStore('room-bound');
	if (!store) {
		throw new Error('store was not created');
	}

	const total = MAX_TOGGLED_COLLAPSIBLES_PER_ROOM + 1;
	for (let i = 0; i < total; i++) {
		store.toggleCollapsible(`bulk-${i}`);
	}

	expect(store.isCollapsibleToggled('bulk-0')).toBe(false);
	expect(store.isCollapsibleToggled('bulk-1')).toBe(true);
	expect(store.isCollapsibleToggled(`bulk-${total - 1}`)).toBe(true);
});

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useMessageRelatedDataValue } from './useMessageRelatedDataValue';
import { RoomManager } from '../../lib/RoomManager';

jest.mock('../../lib/RoomHistoryManager', () => ({ RoomHistoryManager: {} }));

const closeOpenedRoom = () => {
	const currentlyOpened = RoomManager.opened;
	if (currentlyOpened) {
		RoomManager.back(currentlyOpened);
	}
};

const renderCollapsed = (key: string, initiallyCollapsed: boolean) =>
	renderHook(() => useMessageRelatedDataValue({}).useCollapsedState(key, initiallyCollapsed), { wrapper: mockAppRoot().build() });

afterEach(closeOpenedRoom);

describe('the collapsed state of a message part', () => {
	it('toggles with local state when keyed but no room is opened (message-attachments R3)', () => {
		const { result } = renderCollapsed('mid-0', true);
		expect(result.current[0]).toBe(true);

		act(() => result.current[1]());
		expect(result.current[0]).toBe(false);

		act(() => result.current[1]());
		expect(result.current[0]).toBe(true);
	});

	it('is kept in the opened room, so it survives the message unmounting and mounting again (message-attachments R3)', () => {
		RoomManager.open('room-a');
		const { result, unmount } = renderCollapsed('mid-a', false);
		expect(result.current[0]).toBe(false);

		act(() => result.current[1]());
		expect(result.current[0]).toBe(true);
		unmount();

		const { result: remounted } = renderCollapsed('mid-a', false);
		expect(remounted.current[0]).toBe(true);
	});

	it('keeps a part that starts collapsed expanded after it was expanded, once it mounts again (message-attachments R3)', () => {
		RoomManager.open('room-a');
		const { result, unmount } = renderCollapsed('mid-b', true);

		act(() => result.current[1]());
		expect(result.current[0]).toBe(false);
		unmount();

		const { result: remounted } = renderCollapsed('mid-b', true);
		expect(remounted.current[0]).toBe(false);
	});

	it('is kept per room (message-attachments R3)', () => {
		RoomManager.open('room-a');
		const { result, unmount } = renderCollapsed('mid-c', false);
		act(() => result.current[1]());
		unmount();

		closeOpenedRoom();
		RoomManager.open('room-b');
		const { result: inAnotherRoom } = renderCollapsed('mid-c', false);

		expect(inAnotherRoom.current[0]).toBe(false);
	});

	it('toggles with local state when there is no key, even while a room is opened (message-attachments R3)', () => {
		RoomManager.open('room-a');
		const { result, unmount } = renderCollapsed('', false);

		act(() => result.current[1]());
		expect(result.current[0]).toBe(true);
		unmount();

		const { result: remounted } = renderCollapsed('', false);
		expect(remounted.current[0]).toBe(false);
	});

	it('does not change another part of the same room (message-attachments R3)', () => {
		RoomManager.open('room-a');
		const { result: toggled } = renderCollapsed('mid-e1', false);
		const { result: other } = renderCollapsed('mid-e2', false);

		act(() => toggled.current[1]());

		expect(toggled.current[0]).toBe(true);
		expect(other.current[0]).toBe(false);
		expect(renderCollapsed('mid-e2', false).result.current[0]).toBe(false);
	});

	it('shows a change made elsewhere to the same part (message-attachments R3)', () => {
		RoomManager.open('room-a');
		const { result: first } = renderCollapsed('mid-d', false);
		const { result: second } = renderCollapsed('mid-d', false);

		act(() => first.current[1]());

		expect(second.current[0]).toBe(true);
	});
});

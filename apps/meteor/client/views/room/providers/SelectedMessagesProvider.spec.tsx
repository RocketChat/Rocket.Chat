import { renderHook, act } from '@testing-library/react';

import { selectedMessageStore } from './SelectedMessagesProvider';
import { useIsSelectedMessage, useSelectedMessageStore } from '../MessageList/contexts/SelectedMessagesContext';

describe('useSelectedMessageStore', () => {
	it('returns the shared store when rendered without a provider', () => {
		const { result } = renderHook(() => useSelectedMessageStore());

		expect(result.current).toBe(selectedMessageStore);
	});
});

describe('selectedMessageStore', () => {
	beforeEach(() => {
		selectedMessageStore.reset();
		selectedMessageStore.setAvailableMessages([]);
	});

	it('should add available message and emit change', () => {
		const changeListener = jest.fn();
		const unsubscribe = selectedMessageStore.on('change', changeListener);

		selectedMessageStore.addAvailableMessage('msg-1');

		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
		expect(changeListener).toHaveBeenCalledTimes(1);

		unsubscribe();
	});

	it('should not add already selected or duplicate message to availableMessages', () => {
		const changeListener = jest.fn();
		selectedMessageStore.toggle('msg-1'); // selected in store
		const unsubscribe = selectedMessageStore.on('change', changeListener);

		selectedMessageStore.addAvailableMessage('msg-1');
		expect(selectedMessageStore.availableMessagesCount()).toBe(0);
		expect(changeListener).not.toHaveBeenCalled();

		selectedMessageStore.addAvailableMessage('msg-2');
		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
		expect(changeListener).toHaveBeenCalledTimes(1);

		selectedMessageStore.addAvailableMessage('msg-2'); // duplicate
		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
		expect(changeListener).toHaveBeenCalledTimes(1);

		unsubscribe();
	});

	it('should remove available message and emit change', () => {
		selectedMessageStore.addAvailableMessage('msg-1');

		const changeListener = jest.fn();
		const unsubscribe = selectedMessageStore.on('change', changeListener);

		selectedMessageStore.removeAvailableMessage('msg-1');
		expect(selectedMessageStore.availableMessagesCount()).toBe(0);
		expect(changeListener).toHaveBeenCalledTimes(1);

		selectedMessageStore.removeAvailableMessage('msg-nonexistent');
		expect(changeListener).toHaveBeenCalledTimes(1);

		unsubscribe();
	});

	it('should set available messages excluding already selected ones', () => {
		selectedMessageStore.toggle('msg-1');

		const changeListener = jest.fn();
		const unsubscribe = selectedMessageStore.on('change', changeListener);

		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2', 'msg-3']);

		expect(selectedMessageStore.availableMessagesCount()).toBe(2);
		expect(selectedMessageStore.isSelected('msg-1')).toBe(true);
		expect(selectedMessageStore.isSelected('msg-2')).toBe(false);
		expect(changeListener).toHaveBeenCalledTimes(1);

		// Setting same available messages should not emit change
		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2', 'msg-3']);
		expect(changeListener).toHaveBeenCalledTimes(1);

		unsubscribe();
	});

	it('should toggle selection state, updating availableMessages and notifying listeners', () => {
		selectedMessageStore.addAvailableMessage('msg-1');
		expect(selectedMessageStore.availableMessagesCount()).toBe(1);

		const msgListener = jest.fn();
		const unsubscribeMsg = selectedMessageStore.on('msg-1', msgListener);

		// Select msg-1
		selectedMessageStore.toggle('msg-1');
		expect(selectedMessageStore.isSelected('msg-1')).toBe(true);
		expect(selectedMessageStore.count()).toBe(1);
		expect(selectedMessageStore.availableMessagesCount()).toBe(0);
		expect(msgListener).toHaveBeenCalledWith(true);

		// Deselect msg-1
		selectedMessageStore.toggle('msg-1');
		expect(selectedMessageStore.isSelected('msg-1')).toBe(false);
		expect(selectedMessageStore.count()).toBe(0);
		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
		expect(msgListener).toHaveBeenCalledWith(false);

		unsubscribeMsg();
	});

	it('should toggleAll, adding to store, removing from available, and emitting each mid', () => {
		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2', 'msg-3']);
		expect(selectedMessageStore.availableMessagesCount()).toBe(3);

		const listener1 = jest.fn();
		const listener2 = jest.fn();
		const changeListener = jest.fn();

		const unsub1 = selectedMessageStore.on('msg-1', listener1);
		const unsub2 = selectedMessageStore.on('msg-2', listener2);
		const unsubChange = selectedMessageStore.on('change', changeListener);

		selectedMessageStore.toggleAll(['msg-1', 'msg-2']);

		expect(selectedMessageStore.count()).toBe(2);
		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
		expect(selectedMessageStore.isSelected('msg-1')).toBe(true);
		expect(selectedMessageStore.isSelected('msg-2')).toBe(true);
		expect(listener1).toHaveBeenCalledWith(true);
		expect(listener2).toHaveBeenCalledWith(true);
		expect(changeListener).toHaveBeenCalledTimes(1);

		unsub1();
		unsub2();
		unsubChange();
	});

	it('should clearStore and restore cleared messages to availableMessages', () => {
		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2']);
		selectedMessageStore.toggleAll(['msg-1', 'msg-2']);
		expect(selectedMessageStore.count()).toBe(2);

		const listener1 = jest.fn();
		const unsub1 = selectedMessageStore.on('msg-1', listener1);

		selectedMessageStore.clearStore();

		expect(selectedMessageStore.count()).toBe(0);
		expect(selectedMessageStore.availableMessagesCount()).toBe(2);
		expect(listener1).toHaveBeenCalledWith(false);

		unsub1();
	});

	it('should not return a deselected message that is no longer loaded to availableMessages', () => {
		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2']);
		selectedMessageStore.toggle('msg-1');
		selectedMessageStore.setAvailableMessages(['msg-2']);

		selectedMessageStore.toggle('msg-1');

		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
	});

	it('should not restore a cleared message that is no longer loaded', () => {
		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2']);
		selectedMessageStore.toggleAll(['msg-1', 'msg-2']);
		selectedMessageStore.setAvailableMessages(['msg-2']);

		selectedMessageStore.clearStore();

		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
	});

	it('should reset the selection and isSelecting while keeping loaded messages available', () => {
		selectedMessageStore.setIsSelecting(true);
		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2']);
		selectedMessageStore.toggleAll(['msg-1']);

		const toggleSelectingListener = jest.fn();
		const unsubSelecting = selectedMessageStore.on('toggleIsSelecting', toggleSelectingListener);

		selectedMessageStore.reset();

		expect(selectedMessageStore.count()).toBe(0);
		expect(selectedMessageStore.availableMessagesCount()).toBe(2);
		expect(selectedMessageStore.getIsSelecting()).toBe(false);
		expect(toggleSelectingListener).toHaveBeenCalledWith(false);

		unsubSelecting();
	});

	it('should keep messages selectable when selection restarts right after a reset', () => {
		selectedMessageStore.setIsSelecting(true);
		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2']);

		selectedMessageStore.reset();
		selectedMessageStore.setIsSelecting(true);

		expect(selectedMessageStore.availableMessagesCount()).toBe(2);
	});
});

describe('useIsSelectedMessage hook', () => {
	beforeEach(() => {
		selectedMessageStore.reset();
		selectedMessageStore.setAvailableMessages([]);
	});

	it('should return selection status and update when toggleAll selects it', () => {
		selectedMessageStore.setAvailableMessages(['msg-1', 'msg-2']);

		const { result } = renderHook(() => useIsSelectedMessage('msg-1'));
		expect(result.current).toBe(false);

		act(() => {
			selectedMessageStore.toggleAll(['msg-1']);
		});

		expect(result.current).toBe(true);
	});

	it('should not remove message from availableMessages on hook unmount', () => {
		const { unmount } = renderHook(() => useIsSelectedMessage('msg-unmounted'));
		expect(selectedMessageStore.availableMessagesCount()).toBe(1);

		unmount();
		// Unmounting virtual item should not drop it from availableMessages
		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
	});
});

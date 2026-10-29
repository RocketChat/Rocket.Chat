import { act, renderHook } from '@testing-library/react';

import { useStoredItem } from './useStoredItem';
import { STORAGE_KEYS, removeStoredItem, setStoredItem } from '../lib/sdk/storage';

afterEach(() => {
	localStorage.clear();
});

it('reads what is already stored', () => {
	localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

	const { result } = renderHook(() => useStoredItem(STORAGE_KEYS.LOGIN_TOKEN));

	expect(result.current).toBe('a-stored-token');
});

it('reads null for a key with nothing under it', () => {
	const { result } = renderHook(() => useStoredItem(STORAGE_KEYS.LOGIN_TOKEN));

	expect(result.current).toBeNull();
});

// The whole point of the hook: `localStorage` announces a same-tab write to nobody, so the writers have to.
it('re-renders when the value is written', () => {
	const { result } = renderHook(() => useStoredItem(STORAGE_KEYS.LOGIN_TOKEN));

	act(() => {
		setStoredItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-fresh-token');
	});

	expect(result.current).toBe('a-fresh-token');
});

it('re-renders when the value is removed', () => {
	localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-token-on-its-way-out');

	const { result } = renderHook(() => useStoredItem(STORAGE_KEYS.LOGIN_TOKEN));

	act(() => {
		removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
	});

	expect(result.current).toBeNull();
});

// The other half of the same problem: a `storage` event is delivered only to the *other* tabs, so it is the only
// notice a window resuming a session gets that another tab has logged out from under it.
it('re-renders when another tab changes the value', () => {
	localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-token-another-tab-drops');

	const { result } = renderHook(() => useStoredItem(STORAGE_KEYS.LOGIN_TOKEN));

	act(() => {
		// jsdom does not raise `storage` for writes made in the same window — which is right, and why the same-tab
		// path needs `notify` — so stand in for the other tab by removing the value and raising the event by hand.
		localStorage.removeItem(STORAGE_KEYS.LOGIN_TOKEN);
		window.dispatchEvent(
			new StorageEvent('storage', { key: STORAGE_KEYS.LOGIN_TOKEN, oldValue: 'a-token-another-tab-drops', newValue: null }),
		);
	});

	expect(result.current).toBeNull();
});

it('lets go of the storage listener with its last subscriber', () => {
	const addEventListener = jest.spyOn(window, 'addEventListener');
	const removeEventListener = jest.spyOn(window, 'removeEventListener');

	const { unmount } = renderHook(() => useStoredItem(STORAGE_KEYS.LOGIN_TOKEN));

	expect(addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));

	unmount();

	expect(removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function));

	addEventListener.mockRestore();
	removeEventListener.mockRestore();
});

it('ignores a write to another key', () => {
	localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

	const renders = jest.fn();
	renderHook(() => {
		renders();
		return useStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
	});

	const rendersBefore = renders.mock.calls.length;

	act(() => {
		setStoredItem(STORAGE_KEYS.USER_ID, 'john.doe');
	});

	expect(renders).toHaveBeenCalledTimes(rendersBefore);
});

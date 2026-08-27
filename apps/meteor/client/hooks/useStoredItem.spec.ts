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

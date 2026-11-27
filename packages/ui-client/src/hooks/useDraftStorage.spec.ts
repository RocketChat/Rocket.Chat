import { renderHook } from '@testing-library/react';

import { useDraftStorage } from './useDraftStorage';

describe('useDraftStorage', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('should read the value stored under the key, or null when there is none', () => {
		const { result } = renderHook(() => useDraftStorage('messagebox_GENERAL'));

		expect(result.current.get()).toBeNull();

		localStorage.setItem('messagebox_GENERAL', 'hello');

		expect(result.current.get()).toBe('hello');
	});

	it('should write the value under the key', () => {
		const { result } = renderHook(() => useDraftStorage('messagebox_GENERAL-tmid'));

		result.current.set('hello');

		expect(localStorage.getItem('messagebox_GENERAL-tmid')).toBe('hello');
	});

	it.each([undefined, ''])('should remove the stored draft when the value is %j', (value) => {
		localStorage.setItem('messagebox_GENERAL', 'hello');
		const { result } = renderHook(() => useDraftStorage('messagebox_GENERAL'));

		result.current.set(value);

		expect(localStorage.getItem('messagebox_GENERAL')).toBeNull();
	});

	it('should keep the same functions until the key changes', () => {
		const { result, rerender } = renderHook(({ storageKey }) => useDraftStorage(storageKey), { initialProps: { storageKey: 'a' } });
		const first = result.current;

		rerender({ storageKey: 'a' });
		expect(result.current).toBe(first);

		rerender({ storageKey: 'b' });
		expect(result.current).not.toBe(first);
	});
});

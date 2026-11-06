import { act, renderHook } from '@testing-library/react';

import { createBubbleDateStore, initialBubbleDateState, useHiddenDayDivider } from './bubbleDateStore';

const date = '2026-11-03T12:34:56.789Z';

it('notifies only when the state changes', () => {
	const store = createBubbleDateStore();
	const onChange = jest.fn();
	store.subscribe(onChange);

	store.set((current) => ({ ...current, date, show: true, style: { top: '8px' } }));
	expect(onChange).toHaveBeenCalledTimes(1);

	store.set((current) => ({ ...current, style: { top: '8px' } }));
	expect(onChange).toHaveBeenCalledTimes(1);

	store.set((current) => ({ ...current, style: { top: '9px' } }));
	expect(onChange).toHaveBeenCalledTimes(2);
	expect(store.get()).toMatchObject({ date, show: true, style: { top: '9px' } });
});

it('stops notifying a listener that unsubscribed', () => {
	const store = createBubbleDateStore();
	const onChange = jest.fn();
	const unsubscribe = store.subscribe(onChange);

	unsubscribe();
	store.set((current) => ({ ...current, date }));

	expect(onChange).not.toHaveBeenCalled();
});

it('names the day of the divider only while the bubble stands in for it', () => {
	const store = createBubbleDateStore();
	const { result } = renderHook(() => useHiddenDayDivider(store));

	expect(result.current).toBeUndefined();

	act(() => store.set(() => ({ ...initialBubbleDateState, date, show: true, showDivider: false })));
	expect(result.current).toBe('20261103');

	act(() => store.set((current) => ({ ...current, showDivider: true })));
	expect(result.current).toBeUndefined();

	act(() => store.set((current) => ({ ...current, show: false, showDivider: false })));
	expect(result.current).toBeUndefined();
});
